import { z } from "zod";

const cleanText = (value) =>
  value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
const sanitizeString = (schema) =>
  z.preprocess(
    (value) => (typeof value === "string" ? cleanText(value) : value),
    schema,
  );

const couponCodeSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/\s+/g, "").toUpperCase();
  },
  z
    .string()
    .min(3, "Coupon code must be at least 3 characters.")
    .max(32, "Coupon code is too long.")
    .regex(/^[A-Z0-9_-]+$/, "Coupon code format is invalid."),
);

const itemSchema = z
  .object({
    id: sanitizeString(z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/)),
    quantity: z.number().int().min(1).max(10),
  })
  .strict();

const emailSchema = sanitizeString(
  z.string().min(5).max(254).email("Enter a valid email address."),
);
const phoneSchema = sanitizeString(z.string().regex(/^[6-9]\d{9}$/));

const optionalCouponCustomerEmailSchema = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return undefined;
  if (normalized.length > 254) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(normalized)
    ? normalized
    : undefined;
}, emailSchema.optional());

const optionalCouponCustomerPhoneSchema = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\D/g, "").trim();
  if (!normalized) return undefined;
  return /^[6-9]\d{9}$/.test(normalized) ? normalized : undefined;
}, phoneSchema.optional());

const nullablePositiveInteger = (maxValue) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      if (typeof value === "string") {
        const normalized = value.trim();
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z.union([z.number().int().min(1).max(maxValue), z.null()]),
  );

const nullableDate = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    return value;
  },
  z.union([z.null(), z.coerce.date()]),
);

export const validateCouponSchema = z
  .object({
    couponCode: couponCodeSchema,
    items: z.array(itemSchema).min(1).max(20),
    customer: z
      .object({
        email: optionalCouponCustomerEmailSchema,
        phone: optionalCouponCustomerPhoneSchema,
      })
      .strict()
      .optional(),
  })
  .strict();

export const listCouponsQuerySchema = z.object({
  search: sanitizeString(z.string().max(80)).optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export const couponIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid coupon id."),
});

export const createCouponSchema = z
  .object({
    code: couponCodeSchema,
    createdBy: sanitizeString(z.string().max(120)).default(""),
    commission: z.number().min(0).max(100).nullable().default(null),
    discountType: z.enum(["percent", "fixed"]).default("percent"),
    discountValue: z.number().nonnegative().max(1_000_000).default(5),
    isActive: z.boolean().default(true),
    maxUses: nullablePositiveInteger(1_000_000).default(null),
    maxUsesPerUser: nullablePositiveInteger(1000).default(1),
    minOrderAmount: z.number().nonnegative().max(1_000_000).default(0),
    maxDiscount: nullablePositiveInteger(1_000_000).default(null),
    validFrom: nullableDate.default(null),
    validUntil: nullableDate.default(null),
  })
  .strict()
  .refine(
    (value) =>
      !value.validFrom ||
      !value.validUntil ||
      value.validUntil >= value.validFrom,
    {
      message: "validUntil must be after validFrom.",
      path: ["validUntil"],
    },
  )
  .refine(
    (value) =>
      value.discountType !== "percent" ||
      (value.discountValue >= 0 && value.discountValue <= 100),
    {
      message: "Percent discount must be between 0 and 100.",
      path: ["discountValue"],
    },
  );

export const updateCouponSchema = z
  .object({
    code: couponCodeSchema.optional(),
    createdBy: sanitizeString(z.string().max(120)).optional(),
    commission: z.number().min(0).max(100).nullable().optional(),
    discountType: z.enum(["percent", "fixed"]).optional(),
    discountValue: z.number().nonnegative().max(1_000_000).optional(),
    isActive: z.boolean().optional(),
    maxUses: nullablePositiveInteger(1_000_000).optional(),
    maxUsesPerUser: nullablePositiveInteger(1000).optional(),
    minOrderAmount: z.number().nonnegative().max(1_000_000).optional(),
    maxDiscount: nullablePositiveInteger(1_000_000).optional(),
    validFrom: nullableDate.optional(),
    validUntil: nullableDate.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.code !== undefined ||
      value.createdBy !== undefined ||
      value.commission !== undefined ||
      value.discountType !== undefined ||
      value.discountValue !== undefined ||
      value.isActive !== undefined ||
      value.maxUses !== undefined ||
      value.maxUsesPerUser !== undefined ||
      value.minOrderAmount !== undefined ||
      value.maxDiscount !== undefined ||
      value.validFrom !== undefined ||
      value.validUntil !== undefined,
    {
      message: "At least one coupon field is required.",
    },
  )
  .refine(
    (value) =>
      value.validFrom === undefined ||
      value.validUntil === undefined ||
      value.validFrom === null ||
      value.validUntil === null ||
      value.validUntil >= value.validFrom,
    {
      message: "validUntil must be after validFrom.",
      path: ["validUntil"],
    },
  )
  .refine(
    (value) =>
      value.discountType !== "percent" ||
      value.discountValue === undefined ||
      (value.discountValue >= 0 && value.discountValue <= 100),
    {
      message: "Percent discount must be between 0 and 100.",
      path: ["discountValue"],
    },
  );
