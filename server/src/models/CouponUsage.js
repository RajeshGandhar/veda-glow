import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    couponCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: String,
      default: "",
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderValue: {
      type: Number,
      required: true,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

couponUsageSchema.index({ createdAt: -1 });
couponUsageSchema.index({ couponCode: 1, createdAt: -1 });
couponUsageSchema.index({ couponId: 1, customerEmail: 1, createdAt: -1 });
couponUsageSchema.index({ couponId: 1, customerPhone: 1, createdAt: -1 });

const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

export default CouponUsage;
