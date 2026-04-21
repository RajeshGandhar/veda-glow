const PENDING_STATES = ["pending", "created", "partially_paid"];
const PROCESSING_STATES = ["processing"];
const FAILURE_STATES = ["failed"];

export const PAYMENT_EVENT = Object.freeze({
  AUTHORIZED: "payment.authorized",
  CAPTURED: "payment.captured",
  FAILED: "payment.failed",
  VERIFY_CAPTURED: "verify.captured",
});

export function resolvePaymentTargetStatus(eventType) {
  if (eventType === PAYMENT_EVENT.AUTHORIZED) return "processing";
  if (
    eventType === PAYMENT_EVENT.CAPTURED ||
    eventType === PAYMENT_EVENT.VERIFY_CAPTURED
  ) {
    return "paid";
  }
  if (eventType === PAYMENT_EVENT.FAILED) return "failed";
  return null;
}

export function canTransitionPaymentStatus(currentStatus, nextStatus) {
  if (!nextStatus || !currentStatus) return false;
  if (currentStatus === nextStatus) return false;

  if (PENDING_STATES.includes(currentStatus)) {
    return nextStatus === "processing" || nextStatus === "paid" || nextStatus === "failed";
  }

  if (PROCESSING_STATES.includes(currentStatus)) {
    return nextStatus === "paid" || nextStatus === "failed";
  }

  // Reconciliation-only override: late captured can recover failed state.
  if (FAILURE_STATES.includes(currentStatus)) {
    return nextStatus === "paid";
  }

  return false;
}

export function buildPaymentTransitionFilter(nextStatus) {
  if (nextStatus === "processing") {
    return {
      paymentStatus: { $in: PENDING_STATES },
    };
  }

  if (nextStatus === "paid") {
    return {
      paymentStatus: { $in: [...PENDING_STATES, ...PROCESSING_STATES, ...FAILURE_STATES] },
    };
  }

  if (nextStatus === "failed") {
    return {
      paymentStatus: { $in: [...PENDING_STATES, ...PROCESSING_STATES] },
    };
  }

  return {};
}

export function buildNoopGuard() {
  return {
    paymentStatus: { $exists: false },
  };
}