import crypto from "crypto";
import Order from "../models/Order.js";
import WebhookEvent from "../models/WebhookEvent.js";
import {
  buildNoopGuard,
  buildPaymentTransitionFilter,
  PAYMENT_EVENT,
  resolvePaymentTargetStatus,
} from "../utils/paymentState.js";
import { razorpayClient } from "../config/razorpay.js";
import {
  emitReliabilityAlerts,
  incrementMetric,
  logStructured,
} from "../utils/observability.js";
import { env } from "../config/env.js";

const COD_CONFIRMATION_AMOUNT = 39;
const TERMINAL_EVENT_STATES = new Set(["applied", "conflict", "final_ignored"]);
const LOCK_LEASE_MS = env.WEBHOOK_LOCK_LEASE_MS;

export class RetryableWebhookError extends Error {
  constructor(message, code = "RETRYABLE") {
    super(message);
    this.name = "RetryableWebhookError";
    this.retryable = true;
    this.code = code;
  }
}

function expectedAmountPaiseForOrder(order) {
  if (order.paymentType === "cod") {
    return Math.round(COD_CONFIRMATION_AMOUNT * 100);
  }
  return Math.round(order.amount * 100);
}

function buildPaymentUpdateFields(order, razorpayPaymentId, nextStatus) {
  const base = {
    paymentStatus: nextStatus,
    razorpayPaymentId,
  };

  if (nextStatus === "processing") return base;
  if (nextStatus === "failed") return base;

  if (order.paymentType === "cod") {
    return {
      ...base,
      orderStatus: "confirmed",
      advanceAmount: COD_CONFIRMATION_AMOUNT,
      balanceDue: Math.max(order.amount - COD_CONFIRMATION_AMOUNT, 0),
    };
  }

  return {
    ...base,
    orderStatus: "confirmed",
    advanceAmount: order.amount,
    balanceDue: 0,
  };
}

async function upsertWebhookEvent({
  eventId,
  eventType,
  razorpayOrderId,
  razorpayPaymentId,
  eventTimestamp,
  correlationId,
}) {
  try {
    return await WebhookEvent.create({
      eventId,
      eventType,
      source: "razorpay",
      orderId: null,
      razorpayOrderId,
      razorpayPaymentId,
      eventTimestamp,
      processingStatus: "received",
      correlationId,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await WebhookEvent.findOne({ eventId });
    if (!existing) throw error;
    return existing;
  }
}

async function claimEventLock(eventDoc, correlationId) {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LOCK_LEASE_MS);
  const lockOwner = crypto.randomUUID();

  return WebhookEvent.findOneAndUpdate(
    {
      _id: eventDoc._id,
      processingStatus: {
        $in: ["received", "retryable_ignored", "failed", "processing"],
      },
      $or: [{ lockExpiresAt: null }, { lockExpiresAt: { $lt: now } }],
    },
    {
      $set: {
        processingStatus: "processing",
        lockOwner,
        lockExpiresAt: leaseUntil,
        correlationId,
      },
      $inc: { processingAttempts: 1 },
    },
    { new: true },
  );
}

async function setEventState(eventDoc, lockOwner, fields) {
  await WebhookEvent.updateOne(
    { _id: eventDoc._id, lockOwner },
    {
      $set: fields,
      $unset: { lockOwner: "", lockExpiresAt: "" },
    },
  );
}

async function markRetryable(eventDoc, lockOwner, note, correlationId, code) {
  incrementMetric("retry_count", 1, { code });
  await setEventState(eventDoc, lockOwner, {
    processingStatus: "retryable_ignored",
    processingNote: note,
    lastErrorCode: code || "",
    correlationId,
  });
}

async function markFinalIgnored(eventDoc, lockOwner, note, correlationId, code) {
  await setEventState(eventDoc, lockOwner, {
    processingStatus: "final_ignored",
    processingNote: note,
    lastErrorCode: code || "",
    correlationId,
  });
}

async function markConflict(eventDoc, lockOwner, note, correlationId, code) {
  await setEventState(eventDoc, lockOwner, {
    processingStatus: "conflict",
    processingNote: note,
    lastErrorCode: code || "",
    correlationId,
  });
}

async function markApplied(eventDoc, lockOwner, note, correlationId) {
  incrementMetric("webhook_processed", 1, { outcome: "applied" });
  await setEventState(eventDoc, lockOwner, {
    processingStatus: "applied",
    processingNote: note,
    lastErrorCode: "",
    correlationId,
  });
}

async function applyPaymentTransition({
  order,
  razorpayPaymentId,
  targetStatus,
  eventType,
}) {
  const transitionFilter = buildPaymentTransitionFilter(targetStatus);
  const noopGuard = buildNoopGuard(targetStatus);

  if (!transitionFilter) {
    return {
      outcome: "no_change",
      reason: `Unsupported transition target: ${targetStatus}`,
    };
  }

  const updateResult = await Order.updateOne(
    {
      _id: order._id,
      ...(transitionFilter || {}),
      ...(noopGuard || {}),
      $or: [
        { razorpayPaymentId: null },
        { razorpayPaymentId },
        { paymentStatus: "failed" },
      ],
    },
    {
      $set: buildPaymentUpdateFields(order, razorpayPaymentId, targetStatus),
      $inc: { version: 1 },
    },
  );

  if (updateResult.modifiedCount > 0) {
    return {
      outcome: "applied",
      reason: `Applied ${eventType} and moved paymentStatus to ${targetStatus}.`,
    };
  }

  const latestOrder = await Order.findById(order._id);
  if (!latestOrder) {
    return {
      outcome: "retryable",
      reason: "Order disappeared while applying transition.",
      code: "ORDER_DISAPPEARED",
    };
  }

  if (
    latestOrder.razorpayPaymentId &&
    latestOrder.razorpayPaymentId !== razorpayPaymentId
  ) {
    return {
      outcome: "conflict",
      reason: `Payment id mismatch. Existing=${latestOrder.razorpayPaymentId}, Incoming=${razorpayPaymentId}`,
      code: "PAYMENT_ID_CONFLICT",
    };
  }

  return {
    outcome: "no_change",
    reason: `No-op transition. Current=${latestOrder.paymentStatus}`,
  };
}

export async function processPaymentWebhookEvent(jobData) {
  const {
    eventId,
    eventType,
    eventTimestamp,
    correlationId,
    razorpayOrderId,
    razorpayPaymentId,
  } = jobData;

  const eventDoc = await upsertWebhookEvent({
    eventId,
    eventType,
    razorpayOrderId,
    razorpayPaymentId,
    eventTimestamp,
    correlationId,
  });

  if (TERMINAL_EVENT_STATES.has(eventDoc.processingStatus)) {
    logStructured("info", "webhook_event_terminal_skip", {
      correlationId,
      eventId,
      status: eventDoc.processingStatus,
    });
    return { duplicateTerminal: true, status: eventDoc.processingStatus };
  }

  const claimed = await claimEventLock(eventDoc, correlationId);
  if (!claimed) {
    logStructured("warn", "webhook_event_lock_busy", {
      correlationId,
      eventId,
    });
    return { lockBusy: true };
  }

  const lockOwner = claimed.lockOwner;

  try {
    if (!eventType) {
      await markFinalIgnored(
        claimed,
        lockOwner,
        "Missing event type in payload.",
        correlationId,
        "INVALID_EVENT_TYPE",
      );
      return { finalIgnored: true };
    }

    if (!razorpayOrderId) {
      await markFinalIgnored(
        claimed,
        lockOwner,
        "Missing razorpay order id in payload.",
        correlationId,
        "INVALID_ORDER_REFERENCE",
      );
      return { finalIgnored: true };
    }

    if (!razorpayPaymentId) {
      await markFinalIgnored(
        claimed,
        lockOwner,
        "Missing razorpay payment id in payload.",
        correlationId,
        "INVALID_PAYMENT_REFERENCE",
      );
      return { finalIgnored: true };
    }

    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      logStructured("warn", "webhook_event_order_not_found", {
        correlationId,
        eventId,
        razorpayOrderId,
      });
      await markRetryable(
        claimed,
        lockOwner,
        "Order not found for webhook; retrying for transient read failure.",
        correlationId,
        "ORDER_NOT_FOUND_RETRY",
      );
      throw new RetryableWebhookError(
        "Order not found; should retry webhook event.",
        "ORDER_NOT_FOUND_RETRY",
      );
    }

    await WebhookEvent.updateOne(
      { _id: claimed._id, lockOwner },
      { $set: { orderId: order._id } },
    );

    const targetStatus = resolvePaymentTargetStatus(eventType);
    if (!targetStatus) {
      await markFinalIgnored(
        claimed,
        lockOwner,
        `Unhandled event type: ${eventType}`,
        correlationId,
        "UNHANDLED_EVENT",
      );
      return { finalIgnored: true };
    }
    logStructured("info", "webhook_event_target_status_resolved", {
      correlationId,
      eventId,
      eventType,
      targetStatus,
    });

    let gatewayPayment;
    try {
      gatewayPayment = await razorpayClient.payments.fetch(razorpayPaymentId);
    } catch (error) {
      await markRetryable(
        claimed,
        lockOwner,
        `Razorpay fetch failed: ${error?.message || "unknown"}`,
        correlationId,
        "RAZORPAY_API_UNAVAILABLE",
      );
      throw new RetryableWebhookError(
        "Razorpay API unavailable; retry required.",
        "RAZORPAY_API_UNAVAILABLE",
      );
    }

    if (!gatewayPayment || gatewayPayment.id !== razorpayPaymentId) {
      await markRetryable(
        claimed,
        lockOwner,
        "Gateway payment lookup mismatch; retrying.",
        correlationId,
        "GATEWAY_LOOKUP_RETRY",
      );
      throw new RetryableWebhookError(
        "Payment lookup mismatch; retry required.",
        "GATEWAY_LOOKUP_RETRY",
      );
    }

    if (gatewayPayment.order_id !== order.razorpayOrderId) {
      logStructured("error", "webhook_event_conflict_order_id", {
        correlationId,
        eventId,
        expectedOrderId: order.razorpayOrderId,
        actualOrderId: gatewayPayment.order_id,
      });
      await markConflict(
        claimed,
        lockOwner,
        "Payment belongs to different order.",
        correlationId,
        "ORDER_ID_MISMATCH",
      );
      return { conflict: true };
    }

    if (gatewayPayment.currency !== "INR") {
      logStructured("error", "webhook_event_conflict_currency", {
        correlationId,
        eventId,
        currency: gatewayPayment.currency,
      });
      await markConflict(
        claimed,
        lockOwner,
        `Currency mismatch: ${gatewayPayment.currency}`,
        correlationId,
        "CURRENCY_MISMATCH",
      );
      return { conflict: true };
    }

    const expectedAmountPaise = expectedAmountPaiseForOrder(order);
    if (Number(gatewayPayment.amount) !== expectedAmountPaise) {
      logStructured("error", "webhook_event_conflict_amount", {
        correlationId,
        eventId,
        expectedAmountPaise,
        actualAmountPaise: Number(gatewayPayment.amount),
      });
      await markConflict(
        claimed,
        lockOwner,
        `Amount mismatch expected=${expectedAmountPaise}, got=${gatewayPayment.amount}`,
        correlationId,
        "AMOUNT_MISMATCH",
      );
      return { conflict: true };
    }

    if (eventType === PAYMENT_EVENT.CAPTURED && gatewayPayment.status !== "captured") {
      await markRetryable(
        claimed,
        lockOwner,
        `Captured event before gateway settled status=${gatewayPayment.status}`,
        correlationId,
        "CAPTURE_STATUS_PENDING",
      );
      throw new RetryableWebhookError(
        "Captured status not settled yet.",
        "CAPTURE_STATUS_PENDING",
      );
    }

    if (eventType === PAYMENT_EVENT.AUTHORIZED && gatewayPayment.status !== "authorized") {
      if (gatewayPayment.status !== "captured") {
        await markRetryable(
          claimed,
          lockOwner,
          `Authorized event mismatch status=${gatewayPayment.status}`,
          correlationId,
          "AUTHORIZED_STATUS_PENDING",
        );
        throw new RetryableWebhookError(
          "Authorized mismatch before capture.",
          "AUTHORIZED_STATUS_PENDING",
        );
      }
    }

    if (eventType === PAYMENT_EVENT.FAILED) {
      const allowedFailed = new Set(["failed", "refunded"]);
      if (!allowedFailed.has(gatewayPayment.status)) {
        await markRetryable(
          claimed,
          lockOwner,
          `Failed event mismatch status=${gatewayPayment.status}`,
          correlationId,
          "FAILED_STATUS_PENDING",
        );
        throw new RetryableWebhookError(
          "Failed status not settled yet.",
          "FAILED_STATUS_PENDING",
        );
      }
    }

    const effectiveTargetStatus =
      gatewayPayment.status === "captured" ? "paid" : targetStatus;

    const transition = await applyPaymentTransition({
      order,
      razorpayPaymentId,
      targetStatus: effectiveTargetStatus,
      eventType,
    });

    if (transition.outcome === "applied" || transition.outcome === "no_change") {
      await markApplied(claimed, lockOwner, transition.reason, correlationId);
      emitReliabilityAlerts({
        processingAgeMs: Date.now() - new Date(order.createdAt).getTime(),
        retryRate: claimed.processingAttempts,
        mismatchCount: 0,
        correlationId,
      });

      logStructured("info", "webhook_processed", {
        correlationId,
        eventId,
        eventType,
        targetStatus: effectiveTargetStatus,
        transition: transition.outcome,
        orderId: order._id.toString(),
      });
      return { applied: true };
    }

    if (transition.outcome === "conflict") {
      await markConflict(
        claimed,
        lockOwner,
        transition.reason,
        correlationId,
        transition.code || "CONFLICT",
      );
      return { conflict: true };
    }

    await markRetryable(
      claimed,
      lockOwner,
      transition.reason,
      correlationId,
      transition.code || "TRANSITION_RETRY",
    );
    throw new RetryableWebhookError(
      transition.reason,
      transition.code || "TRANSITION_RETRY",
    );
  } catch (error) {
    if (error instanceof RetryableWebhookError) {
      throw error;
    }

    await setEventState(claimed, lockOwner, {
      processingStatus: "failed",
      processingNote: error?.message || "Unknown processing failure.",
      lastErrorCode: error?.code || "UNHANDLED_PROCESSOR_ERROR",
      correlationId,
    });
    incrementMetric("webhook_failed", 1, { source: "processor" });
    throw error;
  }
}

/**
 * Synchronous webhook processing (fallback when queue is unavailable)
 * Uses the same logic as processPaymentWebhookEvent but called directly
 */
export async function processPaymentWebhookSync(jobData) {
  incrementMetric("webhook_processed", 1, { source: "sync_fallback" });
  return processPaymentWebhookEvent(jobData);
}
