import crypto from "crypto";
import { HttpError } from "../utils/httpError.js";
import { isValidRazorpayWebhookSignature } from "../utils/signature.js";
import { enqueuePaymentWebhookJob } from "../queue/paymentWebhook.queue.js";
import { incrementMetric, logStructured } from "../utils/observability.js";
import { env } from "../config/env.js";
import { processPaymentWebhookSync } from "../services/paymentWebhookProcessor.service.js";

function resolveRazorpayOrderId(payload, payment) {
  return (
    payment?.order_id ??
    payload?.payload?.order?.entity?.id ??
    payload?.payload?.payment_link?.entity?.order_id ??
    null
  );
}

function buildEventId({ eventIdHeader, eventType, payload, payment, razorpayOrderId }) {
  if (eventIdHeader?.trim()) {
    return eventIdHeader.trim();
  }

  const paymentId = payment?.id ?? "no_payment";
  const createdAt = payload?.created_at ?? Date.now();
  const orderRef = razorpayOrderId ?? "no_order";
  return `${eventType}:${paymentId}:${orderRef}:${createdAt}`;
}

function createCorrelationId(eventIdHeader) {
  return eventIdHeader?.trim() || crypto.randomUUID();
}

export async function handleRazorpayWebhook(req, res, next) {
  const signature = req.get("x-razorpay-signature");
  const eventIdHeader = req.get("x-razorpay-event-id");
  const correlationId = createCorrelationId(eventIdHeader);

  try {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw new HttpError(503, "Razorpay webhook secret is not configured.");
    }

    if (!signature) {
      throw new HttpError(400, "Missing Razorpay webhook signature.");
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    if (!isValidRazorpayWebhookSignature(rawBody, signature)) {
      throw new HttpError(400, "Invalid Razorpay webhook signature.");
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new HttpError(400, "Invalid webhook JSON payload.");
    }

    const eventType = payload?.event;
    const payment = payload?.payload?.payment?.entity;
    const razorpayOrderId = resolveRazorpayOrderId(payload, payment);
    const razorpayPaymentId = payment?.id ?? null;
    const eventTimestamp = payload?.created_at ?? null;

    if (!eventType) {
      throw new HttpError(400, "Webhook payload missing event type.");
    }

    const eventId = buildEventId({
      eventIdHeader,
      eventType,
      payload,
      payment,
      razorpayOrderId,
    });

    incrementMetric("webhook_received", 1, { source: "http" });

    // Try to enqueue to Redis queue
    let enqueued = false;
    if (env.ENABLE_EMBEDDED_PAYMENT_WORKER) {
      try {
        await enqueuePaymentWebhookJob({
          eventId,
          eventType,
          eventTimestamp,
          correlationId,
          razorpayOrderId,
          razorpayPaymentId,
        });
        enqueued = true;

        logStructured("info", "webhook_enqueued", {
          correlationId,
          eventId,
          eventType,
          razorpayOrderId,
          razorpayPaymentId,
        });
      } catch (queueError) {
        // Redis/Queue failure - log and fall back to sync processing
        logStructured("warn", "webhook_enqueue_failed_fallback_to_sync", {
          correlationId,
          eventId,
          error: queueError?.message || "Queue unavailable",
          fallback: "synchronous_processing",
        });
        incrementMetric("webhook_fallback_sync", 1, { reason: "queue_unavailable" });
      }
    }

    // Fallback: Process synchronously if queue is disabled or failed
    if (!enqueued) {
      logStructured("info", "webhook_processing_sync", {
        correlationId,
        eventId,
        reason: env.ENABLE_EMBEDDED_PAYMENT_WORKER ? "queue_failed" : "queue_disabled",
      });

      await processPaymentWebhookSync({
        eventId,
        eventType,
        eventTimestamp,
        correlationId,
        razorpayOrderId,
        razorpayPaymentId,
      });

      logStructured("info", "webhook_processed_sync", {
        correlationId,
        eventId,
        eventType,
      });
    }

    res.status(202).json({ accepted: true, eventId, correlationId });
  } catch (error) {
    logStructured("error", "webhook_enqueue_failed", {
      correlationId,
      message: error?.message || "Unknown enqueue failure",
      code: error?.code || "ENQUEUE_FAILED",
    });
    next(error);
  }
}
