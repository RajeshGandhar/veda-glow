import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      default: "razorpay",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },
    eventTimestamp: {
      type: Number,
      default: null,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: [
        "received",
        "processing",
        "applied",
        "conflict",
        "retryable_ignored",
        "final_ignored",
        "failed",
      ],
      default: "received",
      index: true,
    },
    processingAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockOwner: {
      type: String,
      default: null,
      trim: true,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    correlationId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    processingNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    lastErrorCode: {
      type: String,
      default: "",
      trim: true,
      maxlength: 64,
    },
  },
  {
    timestamps: true,
  },
);

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);

export default WebhookEvent;
