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
  ORDER_ACCESS_SECRET: z.string().min(16).optional(),
  ORDER_ACCESS_TTL_MINUTES: z.coerce.number().int().min(5).max(43200).default(30),
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
  WEBHOOK_QUEUE_CONCURRENCY: z.coerce.number().int().min(1).max(500).default(100),
  WEBHOOK_QUEUE_ATTEMPTS: z.coerce.number().int().min(1).max(50).default(12),
  WEBHOOK_RETRY_BACKOFF_MS: z.coerce.number().int().min(100).max(60000).default(2000),
  WEBHOOK_LOCK_LEASE_MS: z.coerce.number().int().min(5000).max(900000).default(120000),
  WEBHOOK_TRUSTED_IPS: z.string().optional(),
  METRICS_AUTH_TOKEN: z.string().optional(),
  ENABLE_METRICS: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  ALERT_WEBHOOK_URL: z.string().url().optional(),
  ALERT_RETRY_THRESHOLD: z.coerce.number().int().min(1).max(100000).default(50),
  ALERT_STUCK_ORDERS_THRESHOLD: z.coerce.number().int().min(1).max(100000).default(10),
  ALERT_DLQ_GROWTH_THRESHOLD: z.coerce.number().int().min(1).max(100000).default(5),
  LOG_BUFFER_SIZE: z.coerce.number().int().min(100).max(10000).default(1000),
  RECONCILIATION_CRON: z.string().default("*/5 * * * *"),
  ENABLE_EMBEDDED_PAYMENT_WORKER: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  ENABLE_RECONCILIATION_JOB: z
    .string()
    .optional()
    .transform((value) => value === "true"),
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
