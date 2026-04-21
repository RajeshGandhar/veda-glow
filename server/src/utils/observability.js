import { env } from "../config/env.js";

const counters = new Map();
const gauges = new Map();
const recentLogs = [];
const maxLogBuffer = env.LOG_BUFFER_SIZE;
const lastAlertState = {
  dlqSize: 0,
  dlqGrowthAlertedAt: 0,
  retryAlertedAt: 0,
  stuckAlertedAt: 0,
};

const ALERT_THROTTLE_MS = 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function metricKey(name, tags = {}) {
  return `${name}:${JSON.stringify(tags)}`;
}

function addRecentLog(payload) {
  recentLogs.push(payload);
  if (recentLogs.length > maxLogBuffer) {
    recentLogs.shift();
  }
}

async function sendAlertWebhook(payload) {
  if (!env.ALERT_WEBHOOK_URL) return;

  // Fire-and-forget; never block payment flow.
  fetch(env.ALERT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Best-effort alert delivery.
  });
}

function shouldThrottle(lastAt) {
  return Date.now() - lastAt < ALERT_THROTTLE_MS;
}

export function incrementMetric(name, value = 1, tags = {}) {
  const key = metricKey(name, tags);
  counters.set(key, (counters.get(key) || 0) + value);

  if (name === "retry_count") {
    const total = getMetricTotal("retry_count");
    if (total >= env.ALERT_RETRY_THRESHOLD && !shouldThrottle(lastAlertState.retryAlertedAt)) {
      lastAlertState.retryAlertedAt = Date.now();
      emitAlert("warn", "alert_high_retry_count", {
        retryCount: total,
        threshold: env.ALERT_RETRY_THRESHOLD,
      });
    }
  }
}

export function setGauge(name, value, tags = {}) {
  const key = metricKey(name, tags);
  gauges.set(key, value);

  if (name === "dlq_size") {
    const previous = lastAlertState.dlqSize;
    const growth = value - previous;
    lastAlertState.dlqSize = value;

    if (
      growth >= env.ALERT_DLQ_GROWTH_THRESHOLD &&
      !shouldThrottle(lastAlertState.dlqGrowthAlertedAt)
    ) {
      lastAlertState.dlqGrowthAlertedAt = Date.now();
      emitAlert("error", "alert_dlq_growth", {
        previous,
        current: value,
        growth,
        threshold: env.ALERT_DLQ_GROWTH_THRESHOLD,
      });
    }
  }

  if (name === "stuck_orders_count") {
    if (
      value >= env.ALERT_STUCK_ORDERS_THRESHOLD &&
      !shouldThrottle(lastAlertState.stuckAlertedAt)
    ) {
      lastAlertState.stuckAlertedAt = Date.now();
      emitAlert("warn", "alert_stuck_orders_threshold", {
        stuckOrders: value,
        threshold: env.ALERT_STUCK_ORDERS_THRESHOLD,
      });
    }
  }
}

export function getMetricTotal(name) {
  let total = 0;
  for (const [key, value] of counters.entries()) {
    if (key.startsWith(`${name}:`)) {
      total += value;
    }
  }
  return total;
}

export function getMetricSnapshot() {
  return {
    counters: Array.from(counters.entries()).map(([key, value]) => ({ key, value })),
    gauges: Array.from(gauges.entries()).map(([key, value]) => ({ key, value })),
    totals: {
      webhook_received: getMetricTotal("webhook_received"),
      webhook_processed: getMetricTotal("webhook_processed"),
      webhook_failed: getMetricTotal("webhook_failed"),
      retry_count: getMetricTotal("retry_count"),
      stuck_orders_count: getGaugeValue("stuck_orders_count"),
      dlq_size: getGaugeValue("dlq_size"),
    },
  };
}

export function getGaugeValue(name, tags = {}) {
  const key = metricKey(name, tags);
  return gauges.get(key) ?? 0;
}

export function getRecentLogs({ limit = 100 } = {}) {
  return recentLogs.slice(Math.max(0, recentLogs.length - limit));
}

export function getLogSummary() {
  const summary = {
    totalBuffered: recentLogs.length,
    byLevel: { info: 0, warn: 0, error: 0 },
    byEvent: {},
  };

  for (const entry of recentLogs) {
    const level = entry.level || "info";
    if (summary.byLevel[level] !== undefined) {
      summary.byLevel[level] += 1;
    }
    summary.byEvent[entry.event] = (summary.byEvent[entry.event] || 0) + 1;
  }

  return summary;
}

export function logStructured(level, event, fields = {}) {
  const payload = {
    ts: nowIso(),
    level,
    event,
    correlationId: fields.correlationId || null,
    ...fields,
  };

  addRecentLog(payload);

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }
  console.log(JSON.stringify(payload));
}

export function emitAlert(level, event, fields = {}) {
  const payload = {
    alert: true,
    ts: nowIso(),
    level,
    event,
    ...fields,
  };

  logStructured(level, event, fields);
  sendAlertWebhook(payload);
}

export function emitReliabilityAlerts({
  processingAgeMs,
  retryRate,
  mismatchCount,
  correlationId,
}) {
  if (processingAgeMs > 2 * 60 * 1000) {
    emitAlert("warn", "alert_order_stuck_processing", {
      correlationId,
      processingAgeMs,
      thresholdMs: 120000,
    });
  }

  if (retryRate >= 10) {
    emitAlert("warn", "alert_high_webhook_retry_rate", {
      correlationId,
      retryRate,
    });
  }

  if (mismatchCount >= 3) {
    emitAlert("warn", "alert_payment_mismatch_spike", {
      correlationId,
      mismatchCount,
    });
  }
}
