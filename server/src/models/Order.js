import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    orderNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCreatedBy: {
      type: String,
      default: "",
      trim: true,
    },
    advanceAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentType: {
      type: String,
      enum: ["cod", "razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "created",
        "partially_paid",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    courierName: {
      type: String,
      default: "",
      trim: true,
    },
    trackingNumber: {
      type: String,
      default: "",
      trim: true,
    },
    trackingUrl: {
      type: String,
      default: "",
      trim: true,
    },
    shippedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    invoiceNumber: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({
  name: "text",
  email: "text",
  phone: "text",
  city: "text",
  state: "text",
  pincode: "text",
  trackingNumber: "text",
});

// Performance indexes for common queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
// Compound index for filtering by both status fields
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
// Index for customer lookup
orderSchema.index({ email: 1, phone: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
