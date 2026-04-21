import { Queue, QueueEvents } from "bullmq";
import { env } from "../config/env.js";
import { getRedisConnection } from "../config/redis.js";
import { incrementMetric, logStructured, setGauge } from "../utils/observability.js";

export const PAYMENT_WEBHOOK_QUEUE = "payment-webhook-queue";
export const PAYMENT_WEBHOOK_DLQ = "payment-webhook-dlq";

let paymentWebhookQueue;
let paymentWebhookDlqQueue;
let paymentWebhookQueueEvents;
let queueMetricsInterval;

export function getPaymentWebhookQueue() {
  if (paymentWebhookQueue) return paymentWebhookQueue;
  paymentWebhookQueue = new Queue(PAYMENT_WEBHOOK_QUEUE, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: env.WEBHOOK_QUEUE_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: env.WEBHOOK_RETRY_BACKOFF_MS,
      },
      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 10000,
      },
      removeOnFail: false,
    },
  });
  return paymentWebhookQueue;
}

export function getPaymentWebhookDlqQueue() {
  if (paymentWebhookDlqQueue) return paymentWebhookDlqQueue;
  paymentWebhookDlqQueue = new Queue(PAYMENT_WEBHOOK_DLQ, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    },
  });
  return paymentWebhookDlqQueue;
}

export async function enqueuePaymentWebhookJob(payload) {
  const queue = getPaymentWebhookQueue();
  return queue.add("process-payment-webhook", payload, {
    jobId: payload.eventId,
  });
}

export function initializePaymentQueueEvents() {
  if (paymentWebhookQueueEvents) return paymentWebhookQueueEvents;

  paymentWebhookQueueEvents = new QueueEvents(PAYMENT_WEBHOOK_QUEUE, {
    connection: getRedisConnection(),
  });

  paymentWebhookQueueEvents.on("failed", async ({ jobId, failedReason }) => {
    incrementMetric("webhook_failed", 1, { source: "queue_failed_event" });
    const queue = getPaymentWebhookQueue();
    const failedJob = await queue.getJob(jobId);
    if (!failedJob) return;
    const correlationId = failedJob.data?.correlationId || null;

    logStructured("error", "queue_job_failed", {
      jobId,
      failedReason,
      correlationId,
    });

    const attemptsConfigured = failedJob.opts?.attempts || env.WEBHOOK_QUEUE_ATTEMPTS;
    if (failedJob.attemptsMade < attemptsConfigured) return;

    const dlqQueue = getPaymentWebhookDlqQueue();
    try {
      await dlqQueue.add(
        "dlq-payment-webhook",
        {
          ...failedJob.data,
          failedReason,
          failedAt: new Date().toISOString(),
          attemptsMade: failedJob.attemptsMade,
        },
        {
          jobId: `dlq:${failedJob.id}`,
        },
      );

      logStructured("warn", "queue_job_sent_to_dlq", {
        jobId,
        attemptsMade: failedJob.attemptsMade,
        correlationId,
      });
    } catch (error) {
      if (String(error?.message || "").includes("Job is already waiting")) {
        return;
      }
      logStructured("error", "queue_job_dlq_insert_failed", {
        jobId,
        message: error?.message || "Unknown DLQ insert error",
        correlationId,
      });
    }
  });

  startQueueMetricsMonitor();

  return paymentWebhookQueueEvents;
}

export function startQueueMetricsMonitor() {
  if (queueMetricsInterval) return queueMetricsInterval;
  queueMetricsInterval = setInterval(async () => {
    try {
      const stats = await getQueueStats();
      setGauge("queue_waiting", stats.main.waiting);
      setGauge("queue_active", stats.main.active);
      setGauge("queue_completed", stats.main.completed);
      setGauge("queue_failed", stats.main.failed);
      setGauge("dlq_size", stats.dlq.waiting + stats.dlq.delayed + stats.dlq.active);
    } catch (error) {
      logStructured("warn", "queue_metrics_monitor_failed", {
        message: error?.message || "Unknown queue metrics error",
      });
    }
  }, 15000);
  if (typeof queueMetricsInterval.unref === "function") {
    queueMetricsInterval.unref();
  }
  return queueMetricsInterval;
}

export function stopQueueMetricsMonitor() {
  if (!queueMetricsInterval) return;
  clearInterval(queueMetricsInterval);
  queueMetricsInterval = null;
}

export async function closePaymentQueues() {
  stopQueueMetricsMonitor();
  if (paymentWebhookQueueEvents) {
    await paymentWebhookQueueEvents.close();
    paymentWebhookQueueEvents = null;
  }
  if (paymentWebhookQueue) {
    await paymentWebhookQueue.close();
    paymentWebhookQueue = null;
  }
  if (paymentWebhookDlqQueue) {
    await paymentWebhookDlqQueue.close();
    paymentWebhookDlqQueue = null;
  }
}

export async function retryDlqJob(dlqJobId) {
  const dlqQueue = getPaymentWebhookDlqQueue();
  const mainQueue = getPaymentWebhookQueue();
  const dlqJob = await dlqQueue.getJob(dlqJobId);

  if (!dlqJob) {
    throw new Error(`DLQ job not found: ${dlqJobId}`);
  }

  const payload = dlqJob.data;
  await mainQueue.add("process-payment-webhook", payload, {
    jobId: `replay:${payload.eventId}:${Date.now()}`,
    attempts: env.WEBHOOK_QUEUE_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.WEBHOOK_RETRY_BACKOFF_MS,
    },
  });

  await dlqJob.remove();
}

export async function inspectDlqJobs({ limit = 50 } = {}) {
  const dlqQueue = getPaymentWebhookDlqQueue();
  const jobs = await dlqQueue.getJobs(["waiting", "active", "failed", "delayed"], 0, limit - 1, true);
  return jobs.map((job) => ({
    id: job.id,
    name: job.name,
    timestamp: job.timestamp,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason || null,
    data: {
      eventId: job.data?.eventId,
      eventType: job.data?.eventType,
      correlationId: job.data?.correlationId,
      failedCode: job.data?.failedCode || null,
    },
  }));
}

export async function getQueueStats() {
  const mainQueue = getPaymentWebhookQueue();
  const dlqQueue = getPaymentWebhookDlqQueue();

  const [main, dlq] = await Promise.all([
    mainQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
    dlqQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
  ]);

  return { main, dlq };
}
