/**
 * 🔁 AUTO-RECOVERY SERVICE
 * 
 * Automatically detects and fixes payment system issues without manual intervention.
 * 
 * Features:
 * - Smart retry logic with exponential backoff
 * - Automatic DLQ processing
 * - Stuck order detection and recovery
 * - Self-healing Redis connections
 * - Recovery logging and metrics
 */

import { env } from "../config/env.js";
import { getRedisConnection } from "../config/redis.js";
import {
  getPaymentWebhookQueue,
  getPaymentWebhookDlqQueue,
  inspectDlqJobs,
  retryDlqJob,
} from "../queue/paymentWebhook.queue.js";
import { getStuckOrders, reconcileProcessingOrders } from "./paymentReconciliation.service.js";
import { incrementMetric, logStructured, setGauge } from "../utils/observability.js";

// Configuration
const AUTO_RECOVERY_CONFIG = {
  // DLQ Auto-Retry
  dlqCheckIntervalMs: 5 * 60 * 1000, // Check DLQ every 5 minutes
  dlqMaxRetryAge: 24 * 60 * 60 * 1000, // Don't retry jobs older than 24 hours
  dlqBatchSize: 10, // Process 10 DLQ jobs at a time
  dlqSafeRetryAttempts: 3, // Only retry jobs that failed < 3 times

  // Stuck Order Recovery
  stuckOrderCheckIntervalMs: 10 * 60 * 1000, // Check every 10 minutes
  stuckOrderThreshold: 30 * 60 * 1000, // Orders stuck > 30 minutes
  stuckOrderBatchSize: 20, // Process 20 stuck orders at a time

  // Redis Health Check
  redisHealthCheckIntervalMs: 30 * 1000, // Check every 30 seconds
  redisReconnectDelayMs: 5000, // Wait 5s before reconnecting

  // Safety Limits
  maxRecoveryAttemptsPerHour: 100, // Prevent infinite loops
  recoveryRateLimitWindow: 60 * 60 * 1000, // 1 hour window
};

// Recovery state tracking
const recoveryState = {
  dlqLastCheck: null,
  stuckOrdersLastCheck: null,
  redisLastCheck: null,
  recoveryAttempts: [],
  isRunning: false,
};

let recoveryIntervals = {
  dlq: null,
  stuckOrders: null,
  redisHealth: null,
};

/**
 * Check if we're within rate limits
 */
function isWithinRateLimit() {
  const now = Date.now();
  const windowStart = now - AUTO_RECOVERY_CONFIG.recoveryRateLimitWindow;

  // Clean old attempts
  recoveryState.recoveryAttempts = recoveryState.recoveryAttempts.filter(
    (timestamp) => timestamp > windowStart
  );

  return recoveryState.recoveryAttempts.length < AUTO_RECOVERY_CONFIG.maxRecoveryAttemptsPerHour;
}

/**
 * Record a recovery attempt
 */
function recordRecoveryAttempt() {
  recoveryState.recoveryAttempts.push(Date.now());
}

/**
 * 🔁 AUTO-RETRY DLQ JOBS
 * 
 * Intelligently retry failed jobs from Dead Letter Queue
 */
async function autoRetryDlqJobs() {
  if (!isWithinRateLimit()) {
    logStructured("warn", "auto_recovery_rate_limit_hit", {
      component: "dlq_retry",
      attemptsInWindow: recoveryState.recoveryAttempts.length,
    });
    return { retried: 0, skipped: 0, failed: 0 };
  }

  try {
    recoveryState.dlqLastCheck = new Date();
    const dlqJobs = await inspectDlqJobs({ limit: AUTO_RECOVERY_CONFIG.dlqBatchSize });

    if (dlqJobs.length === 0) {
      return { retried: 0, skipped: 0, failed: 0 };
    }

    logStructured("info", "auto_recovery_dlq_check", {
      jobsFound: dlqJobs.length,
    });

    let retried = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of dlqJobs) {
      try {
        // Safety check: Don't retry old jobs
        const jobAge = Date.now() - job.timestamp;
        if (jobAge > AUTO_RECOVERY_CONFIG.dlqMaxRetryAge) {
          skipped++;
          logStructured("info", "auto_recovery_dlq_job_too_old", {
            jobId: job.id,
            ageHours: Math.round(jobAge / (60 * 60 * 1000)),
          });
          continue;
        }

        // Safety check: Don't retry jobs that failed too many times
        if (job.attemptsMade >= AUTO_RECOVERY_CONFIG.dlqSafeRetryAttempts) {
          skipped++;
          logStructured("info", "auto_recovery_dlq_job_max_attempts", {
            jobId: job.id,
            attemptsMade: job.attemptsMade,
          });
          continue;
        }

        // Safety check: Skip jobs with permanent errors
        const permanentErrors = [
          "INVALID_SIGNATURE",
          "MALFORMED_PAYLOAD",
          "DUPLICATE_EVENT",
        ];
        if (permanentErrors.some((err) => job.failedReason?.includes(err))) {
          skipped++;
          logStructured("info", "auto_recovery_dlq_job_permanent_error", {
            jobId: job.id,
            reason: job.failedReason,
          });
          continue;
        }

        // Retry the job
        await retryDlqJob(job.id);
        retried++;
        recordRecoveryAttempt();

        logStructured("info", "auto_recovery_dlq_job_retried", {
          jobId: job.id,
          eventId: job.data?.eventId,
          attemptsMade: job.attemptsMade,
        });

        incrementMetric("auto_recovery_dlq_retried", 1);
      } catch (error) {
        failed++;
        logStructured("error", "auto_recovery_dlq_retry_failed", {
          jobId: job.id,
          error: error.message,
        });
      }
    }

    setGauge("auto_recovery_dlq_retried_total", retried);
    setGauge("auto_recovery_dlq_skipped_total", skipped);

    return { retried, skipped, failed };
  } catch (error) {
    logStructured("error", "auto_recovery_dlq_check_failed", {
      error: error.message,
    });
    return { retried: 0, skipped: 0, failed: 0 };
  }
}

/**
 * 🧠 AUTO-RECOVER STUCK ORDERS
 * 
 * Detect and fix orders stuck in processing state
 */
async function autoRecoverStuckOrders() {
  if (!isWithinRateLimit()) {
    logStructured("warn", "auto_recovery_rate_limit_hit", {
      component: "stuck_orders",
      attemptsInWindow: recoveryState.recoveryAttempts.length,
    });
    return { recovered: 0, failed: 0 };
  }

  try {
    recoveryState.stuckOrdersLastCheck = new Date();
    
    // Trigger reconciliation for stuck orders
    const result = await reconcileProcessingOrders({
      limit: AUTO_RECOVERY_CONFIG.stuckOrderBatchSize,
    });

    if (result.scanned === 0) {
      return { recovered: 0, failed: 0 };
    }

    logStructured("info", "auto_recovery_stuck_orders_check", {
      ordersFound: result.scanned,
    });

    recordRecoveryAttempt();

    logStructured("info", "auto_recovery_stuck_orders_processed", {
      scanned: result.scanned,
      fixedToPaid: result.fixedToPaid,
      fixedToFailed: result.fixedToFailed,
      unresolved: result.unresolved,
    });

    setGauge("auto_recovery_stuck_orders_fixed", result.fixedToPaid + result.fixedToFailed);
    incrementMetric("auto_recovery_stuck_orders_processed", result.scanned);

    return {
      recovered: result.fixedToPaid + result.fixedToFailed,
      failed: result.unresolved,
    };
  } catch (error) {
    logStructured("error", "auto_recovery_stuck_orders_failed", {
      error: error.message,
    });
    return { recovered: 0, failed: 0 };
  }
}

/**
 * ⚡ REDIS HEALTH CHECK & AUTO-RECONNECT
 * 
 * Monitor Redis connection and reconnect if needed
 */
async function checkRedisHealth() {
  try {
    recoveryState.redisLastCheck = new Date();
    const redis = getRedisConnection();

    // Test connection with PING
    const pong = await redis.ping();

    if (pong !== "PONG") {
      throw new Error("Redis PING failed");
    }

    // Connection is healthy
    setGauge("redis_health", 1);
    return { healthy: true };
  } catch (error) {
    logStructured("error", "auto_recovery_redis_unhealthy", {
      error: error.message,
    });

    setGauge("redis_health", 0);
    incrementMetric("auto_recovery_redis_reconnect_attempts", 1);

    // Attempt reconnection
    try {
      await reconnectRedis();
      return { healthy: true, reconnected: true };
    } catch (reconnectError) {
      logStructured("error", "auto_recovery_redis_reconnect_failed", {
        error: reconnectError.message,
      });
      return { healthy: false };
    }
  }
}

/**
 * Reconnect to Redis
 */
async function reconnectRedis() {
  logStructured("info", "auto_recovery_redis_reconnecting");

  // Wait before reconnecting
  await new Promise((resolve) =>
    setTimeout(resolve, AUTO_RECOVERY_CONFIG.redisReconnectDelayMs)
  );

  const redis = getRedisConnection();
  await redis.connect();

  logStructured("info", "auto_recovery_redis_reconnected");
  incrementMetric("auto_recovery_redis_reconnected", 1);
}

/**
 * 🚀 START AUTO-RECOVERY SYSTEM
 */
export function startAutoRecovery() {
  if (recoveryState.isRunning) {
    logStructured("warn", "auto_recovery_already_running");
    return;
  }

  recoveryState.isRunning = true;

  logStructured("info", "auto_recovery_started", {
    config: {
      dlqCheckInterval: `${AUTO_RECOVERY_CONFIG.dlqCheckIntervalMs / 1000}s`,
      stuckOrderCheckInterval: `${AUTO_RECOVERY_CONFIG.stuckOrderCheckIntervalMs / 1000}s`,
      redisHealthCheckInterval: `${AUTO_RECOVERY_CONFIG.redisHealthCheckIntervalMs / 1000}s`,
      maxRecoveryAttemptsPerHour: AUTO_RECOVERY_CONFIG.maxRecoveryAttemptsPerHour,
    },
  });

  // Start DLQ auto-retry
  recoveryIntervals.dlq = setInterval(async () => {
    try {
      const result = await autoRetryDlqJobs();
      if (result.retried > 0 || result.failed > 0) {
        logStructured("info", "auto_recovery_dlq_cycle_complete", result);
      }
    } catch (error) {
      logStructured("error", "auto_recovery_dlq_cycle_error", {
        error: error.message,
      });
    }
  }, AUTO_RECOVERY_CONFIG.dlqCheckIntervalMs);

  // Start stuck order recovery
  recoveryIntervals.stuckOrders = setInterval(async () => {
    try {
      const result = await autoRecoverStuckOrders();
      if (result.recovered > 0 || result.failed > 0) {
        logStructured("info", "auto_recovery_stuck_orders_cycle_complete", result);
      }
    } catch (error) {
      logStructured("error", "auto_recovery_stuck_orders_cycle_error", {
        error: error.message,
      });
    }
  }, AUTO_RECOVERY_CONFIG.stuckOrderCheckIntervalMs);

  // Start Redis health check
  recoveryIntervals.redisHealth = setInterval(async () => {
    try {
      await checkRedisHealth();
    } catch (error) {
      logStructured("error", "auto_recovery_redis_health_check_error", {
        error: error.message,
      });
    }
  }, AUTO_RECOVERY_CONFIG.redisHealthCheckIntervalMs);

  // Unref intervals so they don't prevent process exit
  Object.values(recoveryIntervals).forEach((interval) => {
    if (interval && typeof interval.unref === "function") {
      interval.unref();
    }
  });

  console.log("🔁 Auto-recovery system started");
}

/**
 * 🛑 STOP AUTO-RECOVERY SYSTEM
 */
export function stopAutoRecovery() {
  if (!recoveryState.isRunning) {
    return;
  }

  Object.entries(recoveryIntervals).forEach(([name, interval]) => {
    if (interval) {
      clearInterval(interval);
      recoveryIntervals[name] = null;
    }
  });

  recoveryState.isRunning = false;

  logStructured("info", "auto_recovery_stopped");
  console.log("🛑 Auto-recovery system stopped");
}

/**
 * 📊 GET RECOVERY STATUS
 */
export function getRecoveryStatus() {
  return {
    isRunning: recoveryState.isRunning,
    lastChecks: {
      dlq: recoveryState.dlqLastCheck,
      stuckOrders: recoveryState.stuckOrdersLastCheck,
      redis: recoveryState.redisLastCheck,
    },
    recoveryAttempts: {
      count: recoveryState.recoveryAttempts.length,
      limit: AUTO_RECOVERY_CONFIG.maxRecoveryAttemptsPerHour,
      windowMs: AUTO_RECOVERY_CONFIG.recoveryRateLimitWindow,
    },
    config: AUTO_RECOVERY_CONFIG,
  };
}

/**
 * 🧪 MANUAL TRIGGER (for testing)
 */
export async function triggerManualRecovery() {
  logStructured("info", "auto_recovery_manual_trigger");

  const results = await Promise.allSettled([
    autoRetryDlqJobs(),
    autoRecoverStuckOrders(),
    checkRedisHealth(),
  ]);

  return {
    dlq: results[0].status === "fulfilled" ? results[0].value : { error: results[0].reason },
    stuckOrders: results[1].status === "fulfilled" ? results[1].value : { error: results[1].reason },
    redis: results[2].status === "fulfilled" ? results[2].value : { error: results[2].reason },
  };
}
