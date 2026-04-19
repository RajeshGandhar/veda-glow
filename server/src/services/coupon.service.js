import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";

const COUPON_INVALID_MESSAGE = "Invalid or inactive coupon code.";

export function normalizeCouponCode(code) {
  if (typeof code !== "string") return "";
  return code.replace(/\s+/g, "").trim().toUpperCase();
}

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function normalizePhone(phone) {
  if (typeof phone !== "string") return "";
  return phone.replace(/\D/g, "").trim();
}

export function calculateCouponDiscount(orderValue, discountInput) {
  if (!Number.isFinite(orderValue) || orderValue <= 0) return 0;

  if (typeof discountInput === "number") {
    if (!Number.isFinite(discountInput) || discountInput <= 0) return 0;
    return Math.round((orderValue * discountInput) / 100);
  }

  if (!discountInput || typeof discountInput !== "object") {
    return 0;
  }

  const discountType = discountInput.discountType ?? "percent";
  let discount = 0;

  if (discountType === "fixed") {
    const fixedAmount = Number(
      discountInput.discountValue ??
        discountInput.fixedDiscount ??
        discountInput.discountAmount ??
        0,
    );

    if (!Number.isFinite(fixedAmount) || fixedAmount <= 0) return 0;
    discount = Math.round(Math.min(fixedAmount, orderValue));
  } else {
    const percent = Number(
      discountInput.discountValue ??
        discountInput.discountPercent ??
        0,
    );

    if (!Number.isFinite(percent) || percent <= 0) return 0;
    discount = Math.round((orderValue * Math.min(percent, 100)) / 100);
  }

  // Apply maxDiscount cap if configured
  const maxDiscount = Number(discountInput.maxDiscount);
  if (Number.isFinite(maxDiscount) && maxDiscount > 0 && discount > maxDiscount) {
    discount = Math.round(maxDiscount);
  }

  return Math.min(discount, orderValue);
}

function getCouponBaseInvalidReason(coupon, { now = new Date(), orderValue = 0 } = {}) {
  if (!coupon) return COUPON_INVALID_MESSAGE;
  if (!coupon.isActive) return "This coupon is not active.";
  if (coupon.validFrom && coupon.validFrom > now) {
    return "This coupon is not active yet.";
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    return "This coupon has expired.";
  }
  if (
    Number.isFinite(coupon.maxUses) &&
    coupon.maxUses !== null &&
    coupon.usedCount >= coupon.maxUses
  ) {
    return "This coupon has reached its maximum usage limit.";
  }
  if (
    Number.isFinite(coupon.minOrderAmount) &&
    coupon.minOrderAmount > 0 &&
    orderValue > 0 &&
    orderValue < coupon.minOrderAmount
  ) {
    return `Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon.`;
  }
  return null;
}

async function getCouponUserUsageCount(
  couponId,
  { customerEmail, customerPhone } = {},
) {
  const normalizedEmail = normalizeEmail(customerEmail);
  const normalizedPhone = normalizePhone(customerPhone);
  const conditions = [];

  if (normalizedEmail) {
    conditions.push({ customerEmail: normalizedEmail });
  }

  if (normalizedPhone) {
    conditions.push({ customerPhone: normalizedPhone });
  }

  if (conditions.length === 0) {
    return 0;
  }

  return CouponUsage.countDocuments({
    couponId,
    $or: conditions,
  });
}

async function getCouponUserLimitInvalidReason(
  coupon,
  { customerEmail, customerPhone } = {},
) {
  if (!coupon || !Number.isFinite(coupon.maxUsesPerUser)) {
    return null;
  }

  const normalizedEmail = normalizeEmail(customerEmail);
  const normalizedPhone = normalizePhone(customerPhone);

  if (!normalizedEmail && !normalizedPhone) {
    return "Enter email or phone before applying this coupon.";
  }

  const usageCount = await getCouponUserUsageCount(coupon._id, {
    customerEmail: normalizedEmail,
    customerPhone: normalizedPhone,
  });

  if (usageCount >= coupon.maxUsesPerUser) {
    return "You have already used this coupon the maximum allowed times.";
  }

  return null;
}

async function findActiveCouponByCode(rawCode, { orderValue = 0 } = {}) {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;

  const coupon = await Coupon.findOne({ code });
  const invalidReason = getCouponBaseInvalidReason(coupon, { orderValue });

  if (invalidReason) {
    return null;
  }

  return coupon;
}

export async function resolveCouponByCode(
  rawCode,
  { customerEmail, customerPhone, enforcePerUserLimit = false, orderValue = 0 } = {},
) {
  const code = normalizeCouponCode(rawCode);

  if (!code) {
    return {
      coupon: null,
      message: COUPON_INVALID_MESSAGE,
    };
  }

  const coupon = await Coupon.findOne({ code });
  const invalidReason = getCouponBaseInvalidReason(coupon, { orderValue });

  if (invalidReason) {
    return {
      coupon: null,
      message: invalidReason,
    };
  }

  if (!enforcePerUserLimit) {
    return {
      coupon,
      message: "",
    };
  }

  const userLimitReason = await getCouponUserLimitInvalidReason(coupon, {
    customerEmail,
    customerPhone,
  });

  if (userLimitReason) {
    return {
      coupon: null,
      message: userLimitReason,
    };
  }

  return {
    coupon,
    message: "",
  };
}

async function assertCouponUsageAllowedForCustomer(coupon, customer = {}) {
  if (!coupon) return;

  const userLimitReason = await getCouponUserLimitInvalidReason(coupon, {
    customerEmail: customer.email,
    customerPhone: customer.phone,
  });

  if (userLimitReason) {
    throw new Error(userLimitReason);
  }
}
