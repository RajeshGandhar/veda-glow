import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },
    createdBy: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    commission: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
      index: true,
    },
    discountValue: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    // Legacy field retained for backward compatibility.
    discountPercent: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    maxUses: {
      type: Number,
      default: null,
      min: 1,
    },
    maxUsesPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.index({ isActive: 1, validUntil: 1 });
couponSchema.index({ isActive: 1, usedCount: 1, maxUses: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
