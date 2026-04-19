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
      enum: ["received", "applied", "ignored", "conflict", "duplicate"],
      default: "received",
      index: true,
    },
    processingNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);

export default WebhookEvent;
