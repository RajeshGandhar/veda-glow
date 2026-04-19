import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ADMIN_EMAIL: z
    .string()
    .email("ADMIN_EMAIL must be a valid email address")
    .optional(),
  ADMIN_PASSWORD_HASH: z
    .string()
    .min(20, "ADMIN_PASSWORD_HASH must be a valid bcrypt hash")
    .optional(),
  ADMIN_SESSION_SECRET: z.string().min(16).optional(),
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  ADMIN_COOKIE_NAME: z.string().min(3).default("vedaglow_admin_session"),
  FRONTEND_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment configuration",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;

// Validate critical production requirements
if (env.NODE_ENV === "production") {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is required in production");
  }
  if (
    env.FRONTEND_ORIGIN.includes("localhost") ||
    env.FRONTEND_ORIGIN.includes("127.0.0.1") ||
    env.FRONTEND_ORIGIN.includes("5173")
  ) {
    throw new Error(
      "FRONTEND_ORIGIN cannot contain localhost/dev URLs in production",
    );
  }
}
