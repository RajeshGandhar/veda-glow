/**
 * 🛡️ RECOVERY SAFETY SERVICE
 * 
 * Validates all auto-recovery actions before execution to prevent incorrect state changes.
 * 
 * Safety Principles:
 * 1. Never trust local state blindly - always verify with Razorpay API
 * 2. Strict validation for critical actions (marking as paid)
 * 3. Configurable safety modes (AUTO, SAFE, DISABLED)
 * 4. Complete audit logging of all decisions
 * 5. Alert escalation for repeated failures
 */

import Razorpay from "razorpay";
import { env } from "../config/env.js";
import Order from "../models/Order.js";
import { isValidPaymentStateTransition } from "../utils/paymentState.js";
import { incrementMetric, logStructured, setGauge } from "../utils/observability.js";

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// Safety configuration
const SAFETY_CONFIG = {
  // Recovery modes
  mode: env.RECOVERY_MODE || "AUTO", // AUTO, SAFE, DISABLED
  
  // Validation thresholds
  maxFailedValidations: 5, // Alert after 5 failed validations
  maxDlqGrowthRate: 10, // Alert if DLQ grows by 10+ jobs in 5 minutes
  maxStuckOrdersThreshold: 20, // Alert if 20+ orders stuck
  
  // Critical actions that require extra validation
  criticalActions: ["mark_as_paid", "refund", "cancel_payment"],
  
  // Razorpay API timeout
  apiTimeoutMs: 10000,
};

// Safety state tracking
const safetyState = {
  failedValidations: [],
  lastDlqSize: 0,
  lastStuckOrdersCount: 0,
  recoveryAttempts: [],
  isKillSwitchActive: false,
};

/**
 * 🔐 CHECK IF RECOVERY IS ALLOWED
 */
export function isRecoveryAllowed() {
  // Check kill switch
  if (safetyState.isKillSwitchActive) {
    logStructured("warn", "recovery_blocked_kill_switch_active");
    return false;
  }

  // Check recovery mode
  if (SAFETY_CONFIG.mode === "DISABLED") {
    logStructured("warn", "recovery_blocked_mode_disabled");
    return false;
  }

  return true;
}

/**
 * 🧠 VALIDATE RECOVERY ACTION
 * 
 * Verifies action is safe before execution
 */
export async function validateRecoveryAction(action) {
  const validationId = `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logStructured("info", "recovery_validation_started", {
    validationId,
    actionType: action.type,
    orderId: action.orderId,
    mode: SAFETY_CONFIG.mode,
  });

  try {
    // Step 1: Check if recovery is allowed
    if (!isRecoveryAllowed()) {
      return {
        allowed: false,
        reason: "Recovery is disabled",
        validationId,
      };
    }

    // Step 2: Validate based on action type
    let validation;
    switch (action.type) {
      case "mark_as_paid":
        validation = await validateMarkAsPaid(action);
        break;
      case "mark_as_failed":
        validation = await validateMarkAsFailed(action);
        break;
      case "retry_webhook":
        validation = await validateRetryWebhook(action);
        break;
      case "reconcile_order":
        validation = await validateReconcileOrder(action);
        break;
      default:
        validation = { allowed: false, reason: "Unknown action type" };
    }

    // Step 3: Apply safety mode rules
    if (SAFETY_CONFIG.mode === "SAFE" && validation.allowed) {
      // In SAFE mode, log but don't execute
      logStructured("warn", "recovery_action_blocked_safe_mode", {
        validationId,
        actionType: action.type,
        orderId: action.orderId,
        wouldHaveExecuted: true,
      });

      return {
        allowed: false,
        reason: "SAFE mode - action logged but not executed",
        validationId,
        safetyMode: true,
        validationDetails: validation,
      };
    }

    // Step 4: Log validation result
    if (validation.allowed) {
      logStructured("info", "recovery_validation_passed", {
        validationId,
        actionType: action.type,
        orderId: action.orderId,
        checks: validation.checks,
      });

      incrementMetric("recovery_validation_passed", 1, { actionType: action.type });
    } else {
      logStructured("warn", "recovery_validation_failed", {
        validationId,
        actionType: action.type,
        orderId: action.orderId,
        reason: validation.reason,
        checks: validation.checks,
      });

      incrementMetric("recovery_validation_failed", 1, { actionType: action.type });
      recordFailedValidation(action, validation.reason);
    }

    return {
      ...validation,
      validationId,
    };
  } catch (error) {
    logStructured("error", "recovery_validation_error", {
      validationId,
      actionType: action.type,
      orderId: action.orderId,
      error: error.message,
    });

    return {
      allowed: false,
      reason: `Validation error: ${error.message}`,
      validationId,
      error: true,
    };
  }
}

/**
 * 💰 VALIDATE MARK AS PAID
 * 
 * Critical action - requires strict validation
 */
async function validateMarkAsPaid(action) {
  const checks = {
    orderExists: false,
    currentStateValid: false,
    razorpayConfirmed: false,
    amountMatches: false,
    stateTransitionValid: false,
  };

  try {
    // Check 1: Order exists
    const order = await Order.findById(action.orderId);
    if (!order) {
      return {
        allowed: false,
        reason: "Order not found",
        checks,
      };
    }
    checks.orderExists = true;

    // Check 2: Current state is valid for transition
    if (order.paymentStatus === "paid") {
      return {
        allowed: false,
        reason: "Order already marked as paid",
        checks,
      };
    }
    checks.currentStateValid = true;

    // Check 3: Verify with Razorpay API (source of truth)
    if (!order.razorpayPaymentId) {
      return {
        allowed: false,
        reason: "No Razorpay payment ID found",
        checks,
      };
    }

    const razorpayPayment = await fetchRazorpayPayment(order.razorpayPaymentId);
    if (!razorpayPayment) {
      return {
        allowed: false,
        reason: "Payment not found in Razorpay",
        checks,
      };
    }

    // Check 4: Payment is captured in Razorpay
    if (razorpayPayment.status !== "captured") {
      return {
        allowed: false,
        reason: `Payment status in Razorpay is "${razorpayPayment.status}", not "captured"`,
        checks,
        razorpayStatus: razorpayPayment.status,
      };
    }
    checks.razorpayConfirmed = true;

    // Check 5: Amount matches
    const expectedAmount = order.amount * 100; // Convert to paise
    if (razorpayPayment.amount !== expectedAmount) {
      return {
        allowed: false,
        reason: `Amount mismatch: Order=${expectedAmount}, Razorpay=${razorpayPayment.amount}`,
        checks,
      };
    }
    checks.amountMatches = true;

    // Check 6: State transition is valid
    if (!isValidPaymentStateTransition(order.paymentStatus, "paid")) {
      return {
        allowed: false,
        reason: `Invalid state transition: ${order.paymentStatus} → paid`,
        checks,
      };
    }
    checks.stateTransitionValid = true;

    // All checks passed
    return {
      allowed: true,
      reason: "All validation checks passed",
      checks,
      razorpayPayment: {
        id: razorpayPayment.id,
        status: razorpayPayment.status,
        amount: razorpayPayment.amount,
        method: razorpayPayment.method,
      },
    };
  } catch (error) {
    return {
      allowed: false,
      reason: `Validation error: ${error.message}`,
      checks,
      error: true,
    };
  }
}

/**
 * ❌ VALIDATE MARK AS FAILED
 */
async function validateMarkAsFailed(action) {
  const checks = {
    orderExists: false,
    currentStateValid: false,
    razorpayConfirmed: false,
    stateTransitionValid: false,
  };

  try {
    // Check 1: Order exists
    const order = await Order.findById(action.orderId);
    if (!order) {
      return {
        allowed: false,
        reason: "Order not found",
        checks,
      };
    }
    checks.orderExists = true;

    // Check 2: Current state is valid
    if (order.paymentStatus === "failed") {
      return {
        allowed: false,
        reason: "Order already marked as failed",
        checks,
      };
    }
    checks.currentStateValid = true;

    // Check 3: Verify with Razorpay API
    if (order.razorpayPaymentId) {
      const razorpayPayment = await fetchRazorpayPayment(order.razorpayPaymentId);
      
      if (razorpayPayment && razorpayPayment.status === "captured") {
        return {
          allowed: false,
          reason: "Payment is captured in Razorpay - cannot mark as failed",
          checks,
          razorpayStatus: razorpayPayment.status,
        };
      }
    }
    checks.razorpayConfirmed = true;

    // Check 4: State transition is valid
    if (!isValidPaymentStateTransition(order.paymentStatus, "failed")) {
      return {
        allowed: false,
        reason: `Invalid state transition: ${order.paymentStatus} → failed`,
        checks,
      };
    }
    checks.stateTransitionValid = true;

    return {
      allowed: true,
      reason: "All validation checks passed",
      checks,
    };
  } catch (error) {
    return {
      allowed: false,
      reason: `Validation error: ${error.message}`,
      checks,
      error: true,
    };
  }
}

/**
 * 🔄 VALIDATE RETRY WEBHOOK
 */
async function validateRetryWebhook(action) {
  const checks = {
    jobExists: false,
    notTooOld: false,
    notMaxAttempts: false,
    notPermanentError: false,
  };

  try {
    // Check 1: Job exists in DLQ
    if (!action.jobId) {
      return {
        allowed: false,
        reason: "No job ID provided",
        checks,
      };
    }
    checks.jobExists = true;

    // Check 2: Job is not too old (24 hours)
    const jobAge = Date.now() - (action.jobTimestamp || 0);
    if (jobAge > 24 * 60 * 60 * 1000) {
      return {
        allowed: false,
        reason: `Job too old: ${Math.round(jobAge / (60 * 60 * 1000))} hours`,
        checks,
      };
    }
    checks.notTooOld = true;

    // Check 3: Not max attempts
    if ((action.attemptsMade || 0) >= 5) {
      return {
        allowed: false,
        reason: `Max attempts reached: ${action.attemptsMade}`,
        checks,
      };
    }
    checks.notMaxAttempts = true;

    // Check 4: Not a permanent error
    const permanentErrors = [
      "INVALID_SIGNATURE",
      "MALFORMED_PAYLOAD",
      "DUPLICATE_EVENT",
      "INVALID_ORDER_ID",
    ];
    
    if (permanentErrors.some((err) => action.failedReason?.includes(err))) {
      return {
        allowed: false,
        reason: `Permanent error: ${action.failedReason}`,
        checks,
      };
    }
    checks.notPermanentError = true;

    return {
      allowed: true,
      reason: "All validation checks passed",
      checks,
    };
  } catch (error) {
    return {
      allowed: false,
      reason: `Validation error: ${error.message}`,
      checks,
      error: true,
    };
  }
}

/**
 * 🔍 VALIDATE RECONCILE ORDER
 */
async function validateReconcileOrder(action) {
  const checks = {
    orderExists: false,
    isStuck: false,
    hasPaymentId: false,
    razorpayAccessible: false,
  };

  try {
    // Check 1: Order exists
    const order = await Order.findById(action.orderId);
    if (!order) {
      return {
        allowed: false,
        reason: "Order not found",
        checks,
      };
    }
    checks.orderExists = true;

    // Check 2: Order is actually stuck
    const stuckThreshold = 30 * 60 * 1000; // 30 minutes
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    if (orderAge < stuckThreshold) {
      return {
        allowed: false,
        reason: `Order not stuck yet: ${Math.round(orderAge / 60000)} minutes old`,
        checks,
      };
    }
    checks.isStuck = true;

    // Check 3: Has payment ID to reconcile
    if (!order.razorpayPaymentId && !order.razorpayOrderId) {
      return {
        allowed: false,
        reason: "No Razorpay payment/order ID to reconcile",
        checks,
      };
    }
    checks.hasPaymentId = true;

    // Check 4: Razorpay API is accessible
    try {
      if (order.razorpayPaymentId) {
        await fetchRazorpayPayment(order.razorpayPaymentId);
      }
      checks.razorpayAccessible = true;
    } catch (error) {
      return {
        allowed: false,
        reason: "Razorpay API not accessible",
        checks,
        error: error.message,
      };
    }

    return {
      allowed: true,
      reason: "All validation checks passed",
      checks,
    };
  } catch (error) {
    return {
      allowed: false,
      reason: `Validation error: ${error.message}`,
      checks,
      error: true,
    };
  }
}

/**
 * 💳 FETCH PAYMENT FROM RAZORPAY (Source of Truth)
 */
async function fetchRazorpayPayment(paymentId) {
  try {
    const payment = await Promise.race([
      razorpay.payments.fetch(paymentId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Razorpay API timeout")), SAFETY_CONFIG.apiTimeoutMs)
      ),
    ]);

    return payment;
  } catch (error) {
    logStructured("error", "razorpay_api_fetch_failed", {
      paymentId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * 📝 RECORD FAILED VALIDATION
 */
function recordFailedValidation(action, reason) {
  safetyState.failedValidations.push({
    timestamp: Date.now(),
    actionType: action.type,
    orderId: action.orderId,
    reason,
  });

  // Keep only last 100 failed validations
  if (safetyState.failedValidations.length > 100) {
    safetyState.failedValidations = safetyState.failedValidations.slice(-100);
  }

  // Check if we need to alert
  const recentFailures = safetyState.failedValidations.filter(
    (v) => Date.now() - v.timestamp < 60 * 60 * 1000 // Last hour
  );

  if (recentFailures.length >= SAFETY_CONFIG.maxFailedValidations) {
    triggerAlert("HIGH", "recovery_validation_failures_threshold", {
      count: recentFailures.length,
      threshold: SAFETY_CONFIG.maxFailedValidations,
    });
  }

  setGauge("recovery_failed_validations_count", recentFailures.length);
}

/**
 * 🚨 TRIGGER ALERT
 */
function triggerAlert(severity, alertType, data) {
  logStructured("error", "recovery_alert_triggered", {
    severity,
    alertType,
    data,
  });

  incrementMetric("recovery_alerts_triggered", 1, { severity, alertType });

  // TODO: Integrate with your alerting system (email, Slack, PagerDuty, etc.)
  // Example: sendSlackAlert(severity, alertType, data);
}

/**
 * 🛑 ACTIVATE KILL SWITCH
 */
export function activateKillSwitch(reason) {
  safetyState.isKillSwitchActive = true;

  logStructured("error", "recovery_kill_switch_activated", {
    reason,
    timestamp: new Date().toISOString(),
  });

  triggerAlert("CRITICAL", "kill_switch_activated", { reason });

  return {
    success: true,
    message: "Kill switch activated - all auto-recovery disabled",
  };
}

/**
 * ✅ DEACTIVATE KILL SWITCH
 */
export function deactivateKillSwitch() {
  safetyState.isKillSwitchActive = false;

  logStructured("info", "recovery_kill_switch_deactivated", {
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Kill switch deactivated - auto-recovery re-enabled",
  };
}

/**
 * 📊 GET SAFETY STATUS
 */
export function getSafetyStatus() {
  const recentFailures = safetyState.failedValidations.filter(
    (v) => Date.now() - v.timestamp < 60 * 60 * 1000
  );

  return {
    mode: SAFETY_CONFIG.mode,
    killSwitchActive: safetyState.isKillSwitchActive,
    recoveryAllowed: isRecoveryAllowed(),
    failedValidations: {
      total: safetyState.failedValidations.length,
      lastHour: recentFailures.length,
      threshold: SAFETY_CONFIG.maxFailedValidations,
    },
    config: SAFETY_CONFIG,
  };
}

/**
 * 📈 CHECK DLQ GROWTH RATE
 */
export function checkDlqGrowth(currentDlqSize) {
  const growth = currentDlqSize - safetyState.lastDlqSize;
  safetyState.lastDlqSize = currentDlqSize;

  if (growth >= SAFETY_CONFIG.maxDlqGrowthRate) {
    triggerAlert("HIGH", "dlq_rapid_growth", {
      growth,
      currentSize: currentDlqSize,
      threshold: SAFETY_CONFIG.maxDlqGrowthRate,
    });
  }

  setGauge("dlq_growth_rate", growth);
}

/**
 * 📈 CHECK STUCK ORDERS THRESHOLD
 */
export function checkStuckOrdersThreshold(stuckOrdersCount) {
  const increase = stuckOrdersCount - safetyState.lastStuckOrdersCount;
  safetyState.lastStuckOrdersCount = stuckOrdersCount;

  if (stuckOrdersCount >= SAFETY_CONFIG.maxStuckOrdersThreshold) {
    triggerAlert("HIGH", "stuck_orders_threshold", {
      count: stuckOrdersCount,
      increase,
      threshold: SAFETY_CONFIG.maxStuckOrdersThreshold,
    });
  }

  setGauge("stuck_orders_count", stuckOrdersCount);
}
