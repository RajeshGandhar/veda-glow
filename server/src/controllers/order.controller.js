import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";
import { getNextSequence } from "../models/Counter.js";
import Order from "../models/Order.js";
import { env } from "../config/env.js";
import { razorpayClient } from "../config/razorpay.js";
import {
  calculateCouponDiscount,
  normalizeCouponCode,
  resolveCouponByCode,
} from "../services/coupon.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { getDiscountedAmount, normalizeItems } from "../utils/pricing.js";
import { createOrderAccessToken } from "../utils/orderAccess.js";
import { createOrderSchema } from "../validations/order.validation.js";

const COD_CONFIRMATION_AMOUNT = 39;

export const createOrder = asyncHandler(async (req, res) => {
  console.log("[CREATE ORDER] Request received", {
    body: JSON.stringify(req.body),
    headers: {
      origin: req.headers.origin,
      contentType: req.headers["content-type"],
    },
  });

  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    console.error("[CREATE ORDER] Validation failed", {
      errors: parsed.error.flatten(),
    });
    throw new HttpError(400, "Invalid order payload.", parsed.error.flatten());
  }

  const { customer, items, paymentType, idempotencyKey, couponCode } =
    parsed.data;

  console.log("[CREATE ORDER] Validated data", {
    customerName: customer.name,
    customerPhone: customer.phone,
    itemsCount: items.length,
    paymentType,
    idempotencyKey,
    couponCode: couponCode || "none",
  });

  const qty = items.reduce((sum, item) => sum + item.quantity, 0);
  const orderValue = getDiscountedAmount(qty);
  const normalizedItems = normalizeItems(items);
  const normalizedCouponCode = normalizeCouponCode(couponCode);
  let appliedCoupon = null;
  let discountAmount = 0;
  let amount = orderValue;

  console.log("[CREATE ORDER] Pricing calculated", {
    qty,
    orderValue,
    amount,
  });

  if (normalizedCouponCode) {
    console.log("[CREATE ORDER] Processing coupon", {
      couponCode: normalizedCouponCode,
    });

    const { coupon, message } = await resolveCouponByCode(
      normalizedCouponCode,
      {
        customerEmail: customer.email,
        customerPhone: customer.phone,
        enforcePerUserLimit: true,
      },
    );

    if (!coupon) {
      console.warn("[CREATE ORDER] Coupon invalid", {
        couponCode: normalizedCouponCode,
        message,
      });
      throw new HttpError(400, message || "Invalid or inactive coupon code.");
    }

    // Explicit second usage check right before checkout creation to reduce race windows.
    const usageCount = await CouponUsage.countDocuments(
      buildCouponUsageQuery(coupon._id, customer),
    );

    if (
      Number.isFinite(coupon.maxUsesPerUser) &&
      usageCount >= coupon.maxUsesPerUser
    ) {
      console.warn("[CREATE ORDER] Coupon usage limit exceeded", {
        couponCode: normalizedCouponCode,
        usageCount,
        maxUsesPerUser: coupon.maxUsesPerUser,
      });
      throw new HttpError(
        400,
        "You have already used this coupon the maximum allowed times.",
      );
    }

    discountAmount = calculateCouponDiscount(orderValue, coupon);
    amount = Math.max(orderValue - discountAmount, 0);
    appliedCoupon = coupon;

    console.log("[CREATE ORDER] Coupon applied", {
      couponCode: normalizedCouponCode,
      discountAmount,
      finalAmount: amount,
    });
  }

  const existingOrder = await Order.findOne({ idempotencyKey });

  if (existingOrder) {
    console.log(
      "[CREATE ORDER] Idempotent request - returning existing order",
      {
        orderId: existingOrder._id.toString(),
        orderNumber: existingOrder.orderNumber,
      },
    );

    if (
      existingOrder.paymentType !== paymentType ||
      existingOrder.qty !== qty ||
      existingOrder.name !== customer.name ||
      existingOrder.phone !== customer.phone ||
      existingOrder.couponCode !== (appliedCoupon?.code ?? null)
    ) {
      console.error("[CREATE ORDER] Idempotency conflict", {
        existing: {
          paymentType: existingOrder.paymentType,
          qty: existingOrder.qty,
          name: existingOrder.name,
          phone: existingOrder.phone,
          couponCode: existingOrder.couponCode,
        },
        new: {
          paymentType,
          qty,
          name: customer.name,
          phone: customer.phone,
          couponCode: appliedCoupon?.code ?? null,
        },
      });
      throw new HttpError(
        409,
        "This checkout attempt was already used with different order details. Please retry checkout.",
      );
    }

    res.status(200).json(buildCreateOrderResponse(existingOrder));
    return;
  }

  const orderNumber = await getNextSequence("orderNumber");

  console.log("[CREATE ORDER] Generated order number", { orderNumber });

  const baseOrder = {
    orderNumber,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    orderNotes: customer.orderNotes ?? "",
    qty,
    amount,
    couponCode: appliedCoupon?.code ?? null,
    discountAmount,
    couponCreatedBy: appliedCoupon?.createdBy ?? "",
    advanceAmount: 0,
    balanceDue: amount,
    paymentType,
    items: normalizedItems,
    idempotencyKey,
  };

  // ============================================================================
  // COD (CASH ON DELIVERY) PAYMENT FLOW
  // ============================================================================
  // For COD orders:
  // 1. Customer pays ₹39 upfront as confirmation (via Razorpay)
  // 2. Remaining amount is collected on delivery by courier
  // 3. Order is marked as "partially_paid" after ₹39 payment
  // 4. advanceAmount = ₹39, balanceDue = (total - ₹39)
  //
  // Example: Order total = ₹499
  // - Razorpay order created for ₹39 (confirmation amount)
  // - After payment: advanceAmount = ₹39, balanceDue = ₹260
  // - Customer pays ₹260 to delivery person
  if (paymentType === "cod") {
    const codAmountPaise = Math.round(COD_CONFIRMATION_AMOUNT * 100);

    console.log("[CREATE ORDER] Creating COD Razorpay order", {
      codAmountPaise,
      codAmountRupees: COD_CONFIRMATION_AMOUNT,
      totalAmount: amount,
    });

    try {
      const razorpayOrder = await razorpayClient.orders.create({
        amount: codAmountPaise, // Only ₹39 charged upfront
        currency: "INR",
        receipt: `veda_cod_${Date.now()}`,
        notes: {
          customerName: customer.name,
          phone: customer.phone,
          paymentType: "cod",
          orderTotal: amount, // Full order amount for reference
          codConfirmation: COD_CONFIRMATION_AMOUNT,
          balanceOnDelivery: Math.max(amount - COD_CONFIRMATION_AMOUNT, 0),
        },
      });

      console.log("[CREATE ORDER] Razorpay COD order created", {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
      });

      let order;
      try {
        order = await Order.create({
          ...baseOrder,
          paymentStatus: "pending",
          orderStatus: "pending", // Will become "confirmed" after ₹39 payment
          razorpayOrderId: razorpayOrder.id,
          // Initial state: no payment received yet
          advanceAmount: 0,
          balanceDue: amount, // Full amount is due initially
        });

        console.log("[CREATE ORDER] COD order created in DB", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          razorpayOrderId: order.razorpayOrderId,
        });
      } catch (error) {
        if (error?.code === 11000) {
          console.log(
            "[CREATE ORDER] Duplicate key error - fetching existing order",
          );
          const duplicateOrder = await Order.findOne({ idempotencyKey });
          if (duplicateOrder) {
            res.status(200).json(buildCreateOrderResponse(duplicateOrder));
            return;
          }
        }
        console.error("[CREATE ORDER] Database error creating COD order", {
          error: error.message,
          code: error.code,
        });
        throw error;
      }

      await trackCouponUsage(order, appliedCoupon, customer, {
        orderValue,
        discountAmount,
        finalAmount: amount,
      });

      console.log("[CREATE ORDER] COD order complete - sending response");

      res.status(201).json(buildCreateOrderResponse(order));
      return;
    } catch (error) {
      console.error("[CREATE ORDER] Razorpay COD order creation failed", {
        error: error.message,
        stack: error.stack,
        razorpayError: error.error,
      });
      throw error;
    }
  }

  const amountPaise = Math.round(amount * 100);

  console.log("[CREATE ORDER] Creating Razorpay order", {
    amountPaise,
    amountRupees: amount,
  });

  try {
    const razorpayOrder = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `veda_${Date.now()}`,
      notes: {
        customerName: customer.name,
        phone: customer.phone,
      },
    });

    console.log("[CREATE ORDER] Razorpay order created", {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
    });

    let order;
    try {
      order = await Order.create({
        ...baseOrder,
        advanceAmount: amount,
        balanceDue: 0,
        paymentStatus: "pending",
        orderStatus: "pending",
        razorpayOrderId: razorpayOrder.id,
      });

      console.log("[CREATE ORDER] Order created in DB", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        razorpayOrderId: order.razorpayOrderId,
      });
    } catch (error) {
      if (error?.code === 11000) {
        console.log(
          "[CREATE ORDER] Duplicate key error - fetching existing order",
        );
        const duplicateOrder = await Order.findOne({ idempotencyKey });
        if (duplicateOrder) {
          res.status(200).json(buildCreateOrderResponse(duplicateOrder));
          return;
        }
      }
      console.error("[CREATE ORDER] Database error creating order", {
        error: error.message,
        code: error.code,
      });
      throw error;
    }

    await trackCouponUsage(order, appliedCoupon, customer, {
      orderValue,
      discountAmount,
      finalAmount: amount,
    });

    console.log("[CREATE ORDER] Order complete - sending response");

    res.status(201).json(buildCreateOrderResponse(order));
  } catch (error) {
    console.error("[CREATE ORDER] Razorpay order creation failed", {
      error: error.message,
      stack: error.stack,
      razorpayError: error.error,
    });
    throw error;
  }
});

export const getOrder = asyncHandler(async (req, res) => {
  const { idempotencyKey } = req.params;

  const order = await Order.findOne({ idempotencyKey });

  if (!order) {
    throw new HttpError(404, "Order not found.");
  }

  res.status(200).json({
    order: serializeOrderPublic(order),
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  console.log("[VERIFY PAYMENT] Request received", {
    idempotencyKey: req.params.idempotencyKey,
    body: JSON.stringify(req.body),
    origin: req.headers.origin,
  });

  const { idempotencyKey } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.error("[VERIFY PAYMENT] Missing required fields", {
      hasOrderId: !!razorpay_order_id,
      hasPaymentId: !!razorpay_payment_id,
      hasSignature: !!razorpay_signature,
    });
    throw new HttpError(400, "Missing payment verification data");
  }

  const order = await Order.findOne({ idempotencyKey });

  if (!order) {
    console.error("[VERIFY PAYMENT] Order not found", { idempotencyKey });
    throw new HttpError(404, "Order not found");
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    console.error("[VERIFY PAYMENT] Order ID mismatch", {
      expected: order.razorpayOrderId,
      received: razorpay_order_id,
    });
    throw new HttpError(400, "Order ID mismatch");
  }

  // Verify signature
  const crypto = await import("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.error("[VERIFY PAYMENT] Signature verification failed", {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });
    throw new HttpError(400, "Invalid payment signature");
  }

  console.log("[VERIFY PAYMENT] Signature verified successfully", {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    razorpayPaymentId: razorpay_payment_id,
  });

  // Update order status
  const isCOD = order.paymentType === "cod";
  const paidAmount = isCOD ? COD_CONFIRMATION_AMOUNT : order.amount;

  order.razorpayPaymentId = razorpay_payment_id;
  order.paymentStatus = isCOD ? "partially_paid" : "paid";
  order.orderStatus = "confirmed";
  order.advanceAmount = paidAmount;
  order.balanceDue = isCOD
    ? Math.max(order.amount - COD_CONFIRMATION_AMOUNT, 0)
    : 0;

  await order.save();

  console.log("[VERIFY PAYMENT] Order updated successfully", {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  });

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    order: serializeOrderPublic(order),
  });
});

function serializeOrderPublic(order) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber ?? null,
    amount: order.amount,
    advanceAmount: order.advanceAmount,
    balanceDue: order.balanceDue,
    paymentType: order.paymentType,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function serializeOrder(order) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber ?? null,
    name: order.name,
    phone: order.phone,
    email: order.email ?? "",
    address: order.address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    orderNotes: order.orderNotes ?? "",
    qty: order.qty,
    amount: order.amount,
    couponCode: order.couponCode ?? null,
    discountAmount: order.discountAmount ?? 0,
    couponCreatedBy: order.couponCreatedBy ?? "",
    advanceAmount: order.advanceAmount,
    balanceDue: order.balanceDue,
    paymentType: order.paymentType,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizePhone(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "").trim();
}

function buildCouponUsageQuery(couponId, customer = {}) {
  const normalizedEmail = normalizeEmail(customer.email);
  const normalizedPhone = normalizePhone(customer.phone);
  const orConditions = [];

  if (normalizedEmail) {
    orConditions.push({ customerEmail: normalizedEmail });
  }

  if (normalizedPhone) {
    orConditions.push({ customerPhone: normalizedPhone });
  }

  if (orConditions.length === 0) {
    return {
      couponId,
      _id: null,
    };
  }

  return {
    couponId,
    $or: orConditions,
  };
}

async function trackCouponUsage(order, coupon, customer, pricing) {
  if (!coupon || !order) return;

  const normalizedEmail = normalizeEmail(customer.email);
  const normalizedPhone = normalizePhone(customer.phone);

  // SECURITY FIX: Use atomic transaction to prevent race conditions on coupon usage limits
  // This ensures the usage count can never exceed maxUsesPerUser even with concurrent requests
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Count current usages WITHIN the transaction
    const currentUsageCount = await CouponUsage.countDocuments(
      buildCouponUsageQuery(coupon._id, customer),
      { session },
    );

    // Check limit again before creating (double-check within transaction)
    if (
      Number.isFinite(coupon.maxUsesPerUser) &&
      currentUsageCount >= coupon.maxUsesPerUser
    ) {
      await session.abortTransaction();
      throw new HttpError(
        400,
        "Coupon usage limit reached. This order will not apply the discount.",
      );
    }

    // Create usage record within transaction
    await CouponUsage.create(
      [
        {
          couponId: coupon._id,
          orderId: order._id,
          couponCode: coupon.code,
          createdBy: coupon.createdBy ?? "",
          customerName: customer.name,
          customerEmail: normalizedEmail,
          customerPhone: normalizedPhone,
          discountPercent:
            coupon.discountType === "percent"
              ? (coupon.discountValue ?? coupon.discountPercent ?? 0)
              : 0,
          discountAmount: pricing.discountAmount,
          orderValue: pricing.orderValue,
          finalAmount: pricing.finalAmount,
        },
      ],
      { session },
    );

    // Increment coupon usage counter atomically
    await Coupon.updateOne(
      { _id: coupon._id },
      {
        $inc: { usedCount: 1 },
        $set: { lastUsedAt: new Date() },
      },
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

function buildCreateOrderResponse(order) {
  const orderAccessToken = createOrderAccessToken(order.idempotencyKey);
  const response = {
    order: serializeOrder(order),
    orderAccessToken,
  };

  if (!order.razorpayOrderId) {
    return response;
  }

  if (order.paymentType === "cod") {
    return {
      ...response,
      codConfirmationAmount: COD_CONFIRMATION_AMOUNT,
      razorpay: {
        keyId: env.RAZORPAY_KEY_ID,
        orderId: order.razorpayOrderId,
        amount: COD_CONFIRMATION_AMOUNT,
        currency: "INR",
      },
    };
  }

  return {
    ...response,
    razorpay: {
      keyId: env.RAZORPAY_KEY_ID,
      orderId: order.razorpayOrderId,
      amount: order.amount,
      currency: "INR",
    },
  };
}
