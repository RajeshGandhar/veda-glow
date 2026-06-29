import { z } from "zod";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "created",
  "partially_paid",
  "paid",
  "failed",
  "refunded",
];

const cleanText = (value) =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const sanitizeString = (schema) =>
  z.preprocess(
    (value) => (typeof value === "string" ? cleanText(value) : value),
    schema,
  );

const personNameSchema = sanitizeString(
  z
    .string()
    .min(2)
    .max(120)
    .regex(
      /^[\p{L}\p{M} .'-]+$/u,
      "Only letters, spaces, dot, apostrophe, and hyphen are allowed.",
    ),
);

const emailSchema = sanitizeString(
  z.string().min(5).max(254).email("Enter a valid email address."),
);

const locationSchema = sanitizeString(
  z
    .string()
    .min(2)
    .max(120)
    .regex(
      /^[\p{L}\p{M} .'-]+$/u,
      "Only letters, spaces, dot, apostrophe, and hyphen are allowed.",
    ),
);

const addressSchema = sanitizeString(
  z
    .string()
    .min(10)
    .max(500)
    .regex(
      /^[\p{L}\p{M}\d\s,./#()'&-]+$/u,
      "Address contains invalid characters.",
    ),
);

const optionalSafeText = (maxLength) =>
  sanitizeString(
    z
      .string()
      .max(maxLength)
      .regex(/^[^<>`]*$/u, "Text contains unsafe characters."),
  ).optional();

const courierNameSchema = sanitizeString(
  z
    .string()
    .max(120)
    .regex(
      /^[\p{L}\p{M}\d .,'&()/-]*$/u,
      "Courier name contains invalid characters.",
    ),
).optional();

export const createOrderSchema = z
  .object({
    customer: z
      .object({
        name: personNameSchema,
        email: emailSchema,
        phone: sanitizeString(z.string().regex(/^[6-9]\d{9}$/)),
        address: addressSchema,
        city: locationSchema,
        state: locationSchema,
        pincode: sanitizeString(z.string().regex(/^\d{6}$/)),
        orderNotes: optionalSafeText(300),
      })
      .strict(),
    items: z
      .array(
        z
          .object({
            id: sanitizeString(
              z
                .string()
                .min(1)
                .max(80)
                .regex(/^[a-zA-Z0-9_-]+$/),
            ),
            name: sanitizeString(z.string().min(1).max(160)),
            quantity: z.number().int().min(1).max(1),
            price: z.number().nonnegative().max(100000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    paymentType: z.enum(["cod", "razorpay"]),
    idempotencyKey: sanitizeString(
      z
        .string()
        .min(16)
        .max(120)
        .regex(/^[a-zA-Z0-9_-]+$/),
    ),
    couponCode: sanitizeString(
      z
        .string()
        .min(3)
        .max(32)
        .regex(/^[a-zA-Z0-9_-]+$/, "Coupon code format is invalid."),
    ).optional(),
  })
  .strict();

export const updateOrderSchema = z
  .object({
    orderStatus: z.enum(ORDER_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    courierName: courierNameSchema,
    trackingNumber: optionalSafeText(120).refine(
      (value) =>
        value === undefined || value === "" || /^[a-zA-Z0-9/_.-]+$/.test(value),
      "Tracking number contains invalid characters.",
    ),
    trackingUrl: z
      .union([
        sanitizeString(z.string().url()).refine(
          (value) => /^https?:\/\//i.test(value),
          "Tracking URL must start with http:// or https://",
        ),
        z.literal(""),
      ])
      .optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.orderStatus !== undefined ||
      value.paymentStatus !== undefined ||
      value.courierName !== undefined ||
      value.trackingNumber !== undefined ||
      value.trackingUrl !== undefined,
    {
      message: "At least one update field is required.",
    },
  );

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: sanitizeString(z.string().max(120)).optional(),
  orderStatus: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});
