import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { getDiscountedAmount } from "../utils/pricing.js";
import {
  calculateCouponDiscount,
  normalizeCouponCode,
  resolveCouponByCode,
} from "../services/coupon.service.js";
import {
  couponIdParamSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from "../validations/coupon.validation.js";

function serializeCoupon(coupon) {
  const remainingUses =
    Number.isFinite(coupon.maxUses) && coupon.maxUses !== null
      ? Math.max(coupon.maxUses - coupon.usedCount, 0)
      : null;

  return {
    id: coupon._id.toString(),
    code: coupon.code,
    createdBy: coupon.createdBy ?? "",
    commission: coupon.commission ?? null,
    discountType: coupon.discountType ?? "percent",
    discountValue:
      coupon.discountValue ??
      (Number.isFinite(coupon.discountPercent) ? coupon.discountPercent : 0),
    discountPercent:
      coupon.discountType === "percent"
        ? coupon.discountValue ?? coupon.discountPercent ?? 0
        : coupon.discountPercent ?? null,
    isActive: coupon.isActive,
    usedCount: coupon.usedCount,
    maxUses: coupon.maxUses ?? null,
    maxUsesPerUser: coupon.maxUsesPerUser ?? null,
    minOrderAmount: coupon.minOrderAmount ?? 0,
    maxDiscount: coupon.maxDiscount ?? null,
    remainingUses,
    validFrom: coupon.validFrom ?? null,
    validUntil: coupon.validUntil ?? null,
    lastUsedAt: coupon.lastUsedAt ?? null,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureCouponId(params) {
  const parsed = couponIdParamSchema.safeParse(params);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid coupon id.");
  }

  return parsed.data.id;
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function toEndOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function parseCouponWriteFields(payload) {
  const updateFields = {};

  if (payload.code !== undefined) {
    updateFields.code = normalizeCouponCode(payload.code);
  }
  if (payload.createdBy !== undefined) {
    updateFields.createdBy = (payload.createdBy ?? "").trim();
  }
  if (payload.commission !== undefined) {
    updateFields.commission = payload.commission;
  }
  if (payload.discountType !== undefined) {
    updateFields.discountType = payload.discountType;
  }
  if (payload.discountValue !== undefined) {
    updateFields.discountValue = payload.discountValue;
    if (payload.discountType === "percent") {
      updateFields.discountPercent = payload.discountValue;
    }
  }
  if (payload.isActive !== undefined) {
    updateFields.isActive = payload.isActive;
  }
  if (payload.maxUses !== undefined) {
    updateFields.maxUses = payload.maxUses;
  }
  if (payload.maxUsesPerUser !== undefined) {
    updateFields.maxUsesPerUser = payload.maxUsesPerUser;
  }
  if (payload.minOrderAmount !== undefined) {
    updateFields.minOrderAmount = payload.minOrderAmount;
  }
  if (payload.maxDiscount !== undefined) {
    updateFields.maxDiscount = payload.maxDiscount;
  }
  if (payload.validFrom !== undefined) {
    updateFields.validFrom = payload.validFrom;
  }
  if (payload.validUntil !== undefined) {
    updateFields.validUntil = payload.validUntil != null
      ? toEndOfDay(payload.validUntil)
      : null;
  }

  return updateFields;
}

function ensureValidDateWindow(validFrom, validUntil) {
  if (!validFrom || !validUntil) return;
  if (validUntil < validFrom) {
    throw new HttpError(400, "validUntil must be after validFrom.");
  }
}

export const validateCoupon = asyncHandler(async (req, res) => {
  const parsed = validateCouponSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(200).json({
      valid: false,
      message: "Invalid coupon request.",
    });
    return;
  }

  const { couponCode, items, customer } = parsed.data;
  const normalizedCode = normalizeCouponCode(couponCode);
  const qty = items.reduce((sum, item) => sum + item.quantity, 0);
  const orderValue = getDiscountedAmount(qty);
  const { coupon, message } = await resolveCouponByCode(normalizedCode, {
    customerEmail: customer?.email,
    customerPhone: customer?.phone,
    enforcePerUserLimit: true,
  });

  if (!coupon) {
    res.status(200).json({
      valid: false,
      message: message || "Invalid or inactive coupon code.",
      orderValue,
      discountAmount: 0,
      finalAmount: orderValue,
    });
    return;
  }

  const discountAmount = calculateCouponDiscount(orderValue, coupon);
  const finalAmount = Math.max(orderValue - discountAmount, 0);

  res.status(200).json({
    valid: true,
    coupon: {
      code: coupon.code,
      createdBy: coupon.createdBy ?? "",
      discountType: coupon.discountType ?? "percent",
      discountValue:
        coupon.discountValue ??
        (Number.isFinite(coupon.discountPercent) ? coupon.discountPercent : 0),
      discountPercent:
        coupon.discountType === "percent"
          ? coupon.discountValue ?? coupon.discountPercent ?? 0
          : coupon.discountPercent ?? null,
    },
    orderValue,
    discountAmount,
    finalAmount,
  });
});

export const listCouponUsages = asyncHandler(async (_req, res) => {
  const usages = await CouponUsage.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.status(200).json({
    usages: usages.map((usage) => ({
      id: usage._id.toString(),
      user: {
        name: usage.customerName,
        email: usage.customerEmail,
        phone: usage.customerPhone,
      },
      couponCode: usage.couponCode,
      createdBy: usage.createdBy ?? "",
      discountPercent: usage.discountPercent,
      discountAmount: usage.discountAmount,
      orderValue: usage.orderValue,
      finalAmount: usage.finalAmount,
      createdAt: usage.createdAt,
    })),
  });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const parsed = listCouponsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid coupon list query.");
  }

  const { search, status } = parsed.data;
  const filter = {};

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (search?.trim()) {
    const safeRegex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ code: safeRegex }, { createdBy: safeRegex }];
  }

  const coupons = await Coupon.find(filter).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    coupons: coupons.map(serializeCoupon),
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const parsed = createCouponSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid coupon payload.", parsed.error.flatten());
  }

  try {
    const nextFields = parseCouponWriteFields(parsed.data);
    ensureValidDateWindow(nextFields.validFrom, nextFields.validUntil);

    const coupon = await Coupon.create(nextFields);
    res.status(201).json({ coupon: serializeCoupon(coupon) });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "Coupon code already exists.");
    }
    throw error;
  }
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const couponId = ensureCouponId(req.params);
  const parsed = updateCouponSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid coupon payload.", parsed.error.flatten());
  }

  try {
    const existingCoupon = await Coupon.findById(couponId);

    if (!existingCoupon) {
      throw new HttpError(404, "Coupon not found.");
    }

    const nextFields = parseCouponWriteFields(parsed.data);
    const nextValidFrom =
      nextFields.validFrom !== undefined
        ? nextFields.validFrom
        : existingCoupon.validFrom;
    const nextValidUntil =
      nextFields.validUntil !== undefined
        ? nextFields.validUntil
        : existingCoupon.validUntil;
    ensureValidDateWindow(nextValidFrom, nextValidUntil);

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $set: nextFields },
      { new: true, runValidators: true },
    );

    if (!coupon) {
      throw new HttpError(404, "Coupon not found.");
    }

    res.status(200).json({
      coupon: serializeCoupon(coupon),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "Coupon code already exists.");
    }
    throw error;
  }
});



export const deleteCoupon = asyncHandler(async (req, res) => {
  const couponId = ensureCouponId(req.params);
  const coupon = await Coupon.findByIdAndDelete(couponId);

  if (!coupon) {
    throw new HttpError(404, "Coupon not found.");
  }

  res.status(200).json({ message: "Coupon deleted." });
});
