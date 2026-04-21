import { Worker } from "bullmq";
import { getRedisConnection } from "../config/redis.js";
import { handleRazorpayWebhook } from "../controllers/payment.controller.js";
import { incrementMetric, logStructured } from "../utils/observability.js";

const PAYMENT_WEBHOOK_QUEUE = "payment-webhook-queue";

const worker = new Worker(
  PAYMENT_WEBHOOK_QUEUE,
  async (job) => {
    const { payload, signature, eventId } = job.data;

    logStructured("info", "Processing queued webhook", {
      eventId,
      eventType: payload?.event,
      jobId: job.id,
    });

    try {
      // Create a mock request/response for the controller
      const mockReq = {
        get: (header) => {
          if (header === "x-razorpay-signature") return signature;
          if (header === "x-razorpay-event-id") return eventId;
          return null;
        },
        body: Buffer.from(JSON.stringify(payload)),
      };

      const mockRes = {
        status: (code) => ({
          json: (data) => {
            logStructured("info", "Webhook processed successfully", {
              eventId,
              statusCode: code,
              response: data,
            });
            return mockRes;
          },
        }),
      };

      const mockNext = (error) => {
        if (error) {
          logStructured("error", "Webhook processing failed", {
            eventId,
            error: error.message,
          });
          throw error;
        }
      };

      await handleRazorpayWebhook(mockReq, mockRes, mockNext);

      incrementMetric("webhook_processed_success");
    } catch (error) {
      incrementMetric("webhook_processed_failure");
      throw error;
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 5,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
);

worker.on("completed", (job) => {
  logStructured("info", "Webhook job completed", { jobId: job.id });
});

worker.on("failed", (job, err) => {
  logStructured("error", "Webhook job failed", {
    jobId: job.id,
    error: err.message,
  });
});

console.log("🚀 Payment webhook worker started");

export function startPaymentWebhookWorker() {
  // Worker is already started when imported
  return worker;
}

export function stopPaymentWebhookWorker() {
  return worker.close();
}

process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down payment webhook worker...");
  await worker.close();
  process.exit(0);
});
