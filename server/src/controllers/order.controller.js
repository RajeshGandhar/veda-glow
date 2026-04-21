import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";
import { getNextSequence } from "../models/Counter.js";
import Order from "../models/Order.js";
import { env } from "../config/env.js";
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
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid order payload.", parsed.error.flatten());
  }

  const { customer, items, paymentType, idempotencyKey, couponCode } =
    parsed.data;
  const qty = items.reduce((sum, item) => sum + item.quantity, 0);
  const orderValue = getDiscountedAmount(qty);
  const normalizedItems = normalizeItems(items);
  const normalizedCouponCode = normalizeCouponCode(couponCode);
  let appliedCoupon = null;
  let discountAmount = 0;
  let amount = orderValue;

  if (normalizedCouponCode) {
    const { coupon, message } = await resolveCouponByCode(
      normalizedCouponCode,
      {
        customerEmail: customer.email,
        customerPhone: customer.phone,
        enforcePerUserLimit: true,
      },
    );

    if (!coupon) {
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
      throw new HttpError(
        400,
        "You have already used this coupon the maximum allowed times.",
      );
    }

    discountAmount = calculateCouponDiscount(orderValue, coupon);
    amount = Math.max(orderValue - discountAmount, 0);
    appliedCoupon = coupon;
  }

  const existingOrder = await Order.findOne({ idempotencyKey });

  if (existingOrder) {
    if (
      existingOrder.paymentType !== paymentType ||
      existingOrder.qty !== qty ||
      existingOrder.name !== customer.name ||
      existingOrder.phone !== customer.phone ||
      existingOrder.couponCode !== (appliedCoupon?.code ?? null)
    ) {
      throw new HttpError(
        409,
        "This checkout attempt was already used with different order details. Please retry checkout.",
      );
    }

    res.status(200).json(buildCreateOrderResponse(existingOrder));
    return;
  }

  const orderNumber = await getNextSequence("orderNumber");

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
  // Example: Order total = ₹299
  // - Razorpay order created for ₹39 (confirmation amount)
  // - After payment: advanceAmount = ₹39, balanceDue = ₹260
  // - Customer pays ₹260 to delivery person
  if (paymentType === "cod") {
    const codAmountPaise = Math.round(COD_CONFIRMATION_AMOUNT * 100);

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
    } catch (error) {
      if (error?.code === 11000) {
        const duplicateOrder = await Order.findOne({ idempotencyKey });
        if (duplicateOrder) {
          res.status(200).json(buildCreateOrderResponse(duplicateOrder));
          return;
        }
      }
      throw error;
    }

    await trackCouponUsage(order, appliedCoupon, customer, {
      orderValue,
      discountAmount,
      finalAmount: amount,
    });

    res.status(201).json(buildCreateOrderResponse(order));
    return;
  }

  const amountPaise = Math.round(amount * 100);
  const razorpayOrder = await razorpayClient.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `veda_${Date.now()}`,
    notes: {
      customerName: customer.name,
      phone: customer.phone,
    },
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
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateOrder = await Order.findOne({ idempotencyKey });
      if (duplicateOrder) {
        res.status(200).json(buildCreateOrderResponse(duplicateOrder));
        return;
      }
    }
    throw error;
  }

  await trackCouponUsage(order, appliedCoupon, customer, {
    orderValue,
    discountAmount,
    finalAmount: amount,
  });

  res.status(201).json(buildCreateOrderResponse(order));
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
