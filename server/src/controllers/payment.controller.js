import crypto from "crypto";
import Order from "../models/Order.js";
import WebhookEvent from "../models/WebhookEvent.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const COD_CONFIRMATION_AMOUNT = 39;

function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new HttpError(503, "Razorpay webhook secret is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

function resolveRazorpayOrderId(payload, payment) {
  return (
    payment?.order_id ??
    payload?.payload?.order?.entity?.id ??
    payload?.payload?.payment_link?.entity?.order_id ??
    null
  );
}

function buildEventId({
  eventIdHeader,
  eventType,
  payload,
  payment,
  razorpayOrderId,
}) {
  if (eventIdHeader?.trim()) {
    return eventIdHeader.trim();
  }

  const paymentId = payment?.id ?? "no_payment";
  const createdAt = payload?.created_at ?? Date.now();
  const orderRef = razorpayOrderId ?? "no_order";
  return `${eventType}:${paymentId}:${orderRef}:${createdAt}`;
}

async function markWebhookEvent(eventDoc, processingStatus, processingNote) {
  if (!eventDoc?._id) return;

  await WebhookEvent.updateOne(
    { _id: eventDoc._id },
    { $set: { processingStatus, processingNote } },
  );
}

export async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.get("x-razorpay-signature");
    const eventIdHeader = req.get("x-razorpay-event-id");

    if (!signature) {
      throw new HttpError(400, "Missing Razorpay webhook signature.");
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

    if (!verifyWebhookSignature(rawBody, signature)) {
      throw new HttpError(400, "Invalid Razorpay webhook signature.");
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const eventType = payload?.event;
    const payment = payload?.payload?.payment?.entity;
    const razorpayOrderId = resolveRazorpayOrderId(payload, payment);
    const razorpayPaymentId = payment?.id ?? null;

    if (!eventType) {
      res.status(200).json({ received: true, ignored: true });
      return;
    }

    const order = razorpayOrderId
      ? await Order.findOne({ razorpayOrderId })
      : null;

    const eventId = buildEventId({
      eventIdHeader,
      eventType,
      payload,
      payment,
      razorpayOrderId,
    });

    let webhookEvent;
    try {
      webhookEvent = await WebhookEvent.create({
        eventId,
        eventType,
        source: "razorpay",
        orderId: order?._id ?? null,
        razorpayOrderId,
        razorpayPaymentId,
        eventTimestamp: payload?.created_at ?? null,
        processingStatus: "received",
      });
    } catch (error) {
      if (error?.code === 11000) {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      throw error;
    }

    if (!order || !razorpayPaymentId) {
      await markWebhookEvent(
        webhookEvent,
        "ignored",
        !order
          ? "No local order found for Razorpay order reference."
          : "Webhook payload did not include payment id.",
      );
      res.status(200).json({ received: true, ignored: true });
      return;
    }

    if (
      order.razorpayPaymentId &&
      order.razorpayPaymentId !== razorpayPaymentId
    ) {
      await markWebhookEvent(
        webhookEvent,
        "conflict",
        `Payment id mismatch for order. Existing=${order.razorpayPaymentId}, Incoming=${razorpayPaymentId}`,
      );
      res.status(200).json({ received: true, ignored: true, conflict: true });
      return;
    }

    if (eventType === "payment.failed") {
      const failedUpdateResult = await Order.updateOne(
        {
          _id: order._id,
          $or: [{ razorpayPaymentId: null }, { razorpayPaymentId }],
          paymentStatus: { $nin: ["paid", "partially_paid", "failed"] },
          version: order.version,
        },
        {
          $set: {
            paymentStatus: "failed",
            razorpayPaymentId,
          },
          $inc: { version: 1 },
        },
      );

      await markWebhookEvent(
        webhookEvent,
        failedUpdateResult.modifiedCount > 0 ? "applied" : "ignored",
        failedUpdateResult.modifiedCount > 0
          ? "Marked payment status failed from webhook."
          : "No state change needed (already finalized or same status).",
      );

      res.status(200).json({ received: true });
      return;
    }

    // ============================================================================
    // WEBHOOK PAYMENT PROCESSING
    // ============================================================================
    // payment.authorized or payment.captured events
    //
    // COD ORDERS:
    // - Customer paid ₹39 confirmation amount
    // - Mark as "partially_paid" (not "paid")
    // - Set advanceAmount = ₹39
    // - Set balanceDue = (order.amount - ₹39)
    // - Remaining amount collected by delivery person
    //
    // PREPAID ORDERS:
    // - Customer paid full amount
    // - Mark as "paid"
    // - Set advanceAmount = order.amount
    // - Set balanceDue = 0
    if (
      eventType === "payment.authorized" ||
      eventType === "payment.captured"
    ) {
      if (order.paymentType === "cod") {
        const codUpdateResult = await Order.updateOne(
          {
            _id: order._id,
            $or: [{ razorpayPaymentId: null }, { razorpayPaymentId }],
            // Never downgrade a fully paid COD order to partially_paid
            paymentStatus: { $ne: "paid" },
            version: order.version,
          },
          {
            $set: {
              razorpayPaymentId,
              paymentStatus: "partially_paid", // Only ₹39 paid online
              orderStatus: "confirmed",
              advanceAmount: COD_CONFIRMATION_AMOUNT, // ₹39
              balanceDue: Math.max(order.amount - COD_CONFIRMATION_AMOUNT, 0), // Rest on delivery
            },
            $inc: { version: 1 },
          },
        );
        await markWebhookEvent(
          webhookEvent,
          codUpdateResult.modifiedCount > 0 ? "applied" : "ignored",
          codUpdateResult.modifiedCount > 0
            ? `Applied ${eventType} to COD order. Advance: ₹${COD_CONFIRMATION_AMOUNT}, Balance: ₹${Math.max(order.amount - COD_CONFIRMATION_AMOUNT, 0)}`
            : `Ignored ${eventType}; order already finalized.`,
        );
      } else {
        const prepaidUpdateResult = await Order.updateOne(
          {
            _id: order._id,
            $or: [{ razorpayPaymentId: null }, { razorpayPaymentId }],
            version: order.version,
          },
          {
            $set: {
              razorpayPaymentId,
              paymentStatus: "paid", // Full amount paid
              orderStatus: "confirmed",
              advanceAmount: order.amount, // Full amount
              balanceDue: 0, // Nothing due
            },
            $inc: { version: 1 },
          },
        );
        await markWebhookEvent(
          webhookEvent,
          prepaidUpdateResult.modifiedCount > 0 ? "applied" : "ignored",
          prepaidUpdateResult.modifiedCount > 0
            ? `Applied ${eventType} to prepaid order. Full amount paid: ₹${order.amount}`
            : `Ignored ${eventType}; no order state change needed.`,
        );
      }
      res.status(200).json({ received: true });
      return;
    }

    await markWebhookEvent(
      webhookEvent,
      "ignored",
      `Unhandled webhook event type: ${eventType}`,
    );
    res.status(200).json({ received: true, ignored: true });
  } catch (error) {
    next(error);
  }
}
