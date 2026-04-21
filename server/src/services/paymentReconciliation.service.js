import Order from "../models/Order.js";
import { razorpayClient } from "../config/razorpay.js";
import { buildNoopGuard, buildPaymentTransitionFilter } from "../utils/paymentState.js";
import { incrementMetric, logStructured, setGauge } from "../utils/observability.js";

const COD_CONFIRMATION_AMOUNT = 39;
const STUCK_THRESHOLD_MS = 2 * 60 * 1000;

function buildPaidFields(order, razorpayPaymentId) {
  if (order.paymentType === "cod") {
    return {
      paymentStatus: "paid",
      orderStatus: "confirmed",
      razorpayPaymentId,
      advanceAmount: COD_CONFIRMATION_AMOUNT,
      balanceDue: Math.max(order.amount - COD_CONFIRMATION_AMOUNT, 0),
    };
  }
  return {
    paymentStatus: "paid",
    orderStatus: "confirmed",
    razorpayPaymentId,
    advanceAmount: order.amount,
    balanceDue: 0,
  };
}

function buildFailedFields(order, razorpayPaymentId) {
  return {
    paymentStatus: "failed",
    razorpayPaymentId,
    orderStatus: order.orderStatus,
  };
}

async function applyTransition(order, targetStatus, razorpayPaymentId) {
  const transitionFilter = buildPaymentTransitionFilter(targetStatus);
  const noopGuard = buildNoopGuard(targetStatus);
  if (!transitionFilter) return false;

  const updateFields =
    targetStatus === "paid"
      ? buildPaidFields(order, razorpayPaymentId)
      : buildFailedFields(order, razorpayPaymentId);

  const result = await Order.updateOne(
    {
      _id: order._id,
      ...(transitionFilter || {}),
      ...(noopGuard || {}),
      $or: [{ razorpayPaymentId: null }, { razorpayPaymentId }, { paymentStatus: "failed" }],
    },
    {
      $set: updateFields,
      $inc: { version: 1 },
    },
  );

  return result.modifiedCount > 0;
}

export async function reconcileProcessingOrders({ limit = 200 } = {}) {
  const now = Date.now();
  const staleSince = new Date(now - STUCK_THRESHOLD_MS);

  const stuckOrders = await Order.find({
    paymentStatus: "processing",
    updatedAt: { $lte: staleSince },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);

  incrementMetric("stuck_orders_count", stuckOrders.length, { source: "reconciliation_scan" });
  setGauge("stuck_orders_count", stuckOrders.length);

  let fixedToPaid = 0;
  let fixedToFailed = 0;
  let unresolved = 0;

  for (const order of stuckOrders) {
    if (!order.razorpayPaymentId) {
      unresolved += 1;
      continue;
    }

    let payment;
    try {
      payment = await razorpayClient.payments.fetch(order.razorpayPaymentId);
    } catch (error) {
      unresolved += 1;
      logStructured("warn", "reconciliation_gateway_fetch_failed", {
        orderId: order._id.toString(),
        paymentId: order.razorpayPaymentId,
        message: error?.message || "Unknown error",
      });
      continue;
    }

    if (!payment || payment.order_id !== order.razorpayOrderId) {
      unresolved += 1;
      continue;
    }

    if (payment.status === "captured") {
      const updated = await applyTransition(order, "paid", payment.id);
      if (updated) {
        fixedToPaid += 1;
        incrementMetric("webhook_processed", 1, { source: "reconciliation" });
      }
      continue;
    }

    if (payment.status === "failed" || payment.status === "refunded") {
      const updated = await applyTransition(order, "failed", payment.id);
      if (updated) {
        fixedToFailed += 1;
      }
      continue;
    }

    unresolved += 1;
  }

  logStructured("info", "reconciliation_completed", {
    scanned: stuckOrders.length,
    fixedToPaid,
    fixedToFailed,
    unresolved,
  });

  return {
    scanned: stuckOrders.length,
    fixedToPaid,
    fixedToFailed,
    unresolved,
  };
}

export async function getStuckOrders({ limit = 50 } = {}) {
  const staleSince = new Date(Date.now() - STUCK_THRESHOLD_MS);
  const orders = await Order.find({
    paymentStatus: "processing",
    updatedAt: { $lte: staleSince },
  })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .select({
      orderNumber: 1,
      paymentStatus: 1,
      orderStatus: 1,
      amount: 1,
      razorpayOrderId: 1,
      razorpayPaymentId: 1,
      updatedAt: 1,
      createdAt: 1,
    });

  return orders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber ?? null,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    amount: order.amount,
    razorpayOrderId: order.razorpayOrderId ?? null,
    razorpayPaymentId: order.razorpayPaymentId ?? null,
    updatedAt: order.updatedAt,
    createdAt: order.createdAt,
  }));
}
