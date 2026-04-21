import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { sentryRequestHandler, sentryErrorHandler } from "./utils/sentry.js";
import couponRoutes from "./routes/coupon.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { getGaugeValue, getMetricSnapshot } from "./utils/observability.js";

const app = express();

// ============================================================================
// TRUST PROXY CONFIGURATION
// ============================================================================
// CRITICAL: Must be set BEFORE any middleware that reads IP addresses
// (like express-rate-limit, helmet, etc.)
//
// WHY THIS IS NEEDED:
// - When behind a proxy (ngrok, nginx, load balancer), Express sees the proxy's IP
// - The real client IP is in X-Forwarded-For header
// - express-rate-limit needs the real IP to track rate limits per user
// - Without this, all requests appear to come from the same IP (the proxy)
//
// WHAT IT DOES:
// - Tells Express to trust the first proxy (ngrok, nginx, etc.)
// - Makes req.ip return the real client IP from X-Forwarded-For
// - Prevents ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error
//
// PRODUCTION SAFETY:
// - "trust proxy: 1" means trust only the first proxy (most secure)
// - For multiple proxies (e.g., Cloudflare + nginx), use higher number
// - For single proxy (ngrok, Render, Heroku), use 1
//
// REFERENCE: https://expressjs.com/en/guide/behind-proxies.html
app.set("trust proxy", 1);

const configuredOrigins = env.FRONTEND_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const devOrigins =
  env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = Array.from(
  new Set([...configuredOrigins, ...devOrigins]),
);

// Security validation: Ensure production origins are HTTPS
if (env.NODE_ENV === "production") {
  const insecureOrigins = allowedOrigins.filter(
    (origin) => origin.startsWith("http://") && !origin.includes("localhost")
  );
  if (insecureOrigins.length > 0) {
    console.error("[CORS Security] Production origins must use HTTPS:", insecureOrigins);
    throw new Error("Production CORS origins must use HTTPS");
  }
}

console.log("[CORS] Allowed origins:", allowedOrigins);

// Production-ready CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Block all other origins
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"], // Allowed headers
    exposedHeaders: ["Set-Cookie"], // Headers that client can access
    maxAge: 86400, // Cache preflight response for 24 hours (in seconds)
    optionsSuccessStatus: 204, // Success status for preflight requests
  }),
);

// Enhanced security headers configuration
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind
          "https://fonts.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://api.sardine.ai",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["https://checkout.razorpay.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
      reportUri: env.NODE_ENV === "production" ? undefined : undefined,
    },
    // Prevent clickjacking
    frameguard: {
      action: "deny",
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // Enable XSS filtering
    xssFilter: true,
    // Referrer policy
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    // Strict Transport Security (HSTS)
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disabled for Razorpay compatibility
  }),
);
app.use(cookieParser());

// Sentry request handler - captures request context for error tracking
app.use(sentryRequestHandler);

// SECURITY FIX: Enforce HTTPS in production
app.use((req, res, next) => {
  if (env.NODE_ENV === "production") {
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    if (protocol !== "https") {
      return res
        .status(403)
        .json({ message: "HTTPS required. HTTP connections not allowed." });
    }
  }
  next();
});

// ============================================================================
// MIDDLEWARE ORDER - CRITICAL FOR WEBHOOK HANDLING
// ============================================================================
// 1. Webhook route MUST come BEFORE express.json()
//    - Razorpay signature verification requires raw body (Buffer)
//    - express.json() would parse it into an object, breaking verification
//    - express.raw() preserves the raw Buffer for crypto.createHmac()
//
// 2. Payment routes include both webhook AND verify-payment
//    - Webhook: needs raw body (express.raw applied in route)
//    - Verify-payment: needs JSON body (express.json applied after)
//
// 3. This order ensures:
//    - /api/payments/webhook gets raw body
//    - /api/orders/:id/verify-payment gets parsed JSON
//    - No conflicts between the two
app.use(
  "/api/payments",
  express.raw({ type: "application/json", limit: "1mb" }),
  paymentRoutes,
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", async (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  let queueStats = null;
  let queueReady = true;

  // Only check queue stats if Redis-dependent features are enabled
  if (env.ENABLE_EMBEDDED_PAYMENT_WORKER || env.ENABLE_RECONCILIATION_JOB) {
    try {
      const { getQueueStats } = await import("./queue/paymentWebhook.queue.js");
      queueStats = await getQueueStats();
    } catch {
      queueReady = false;
    }
  }

  const overallOk = dbReady && queueReady;
  const statusCode = overallOk ? 200 : 503;
  const metricSnapshot = getMetricSnapshot();

  res.status(statusCode).json({
    status: overallOk ? "ok" : "degraded",
    database: dbReady ? "connected" : "disconnected",
    queue: queueReady ? "connected" : "disabled",
    worker: {
      mode: env.ENABLE_EMBEDDED_PAYMENT_WORKER ? "embedded" : "disabled",
      activeJobs: queueStats?.main?.active ?? null,
    },
    metrics: {
      webhook_received: metricSnapshot.totals.webhook_received,
      webhook_processed: metricSnapshot.totals.webhook_processed,
      webhook_failed: metricSnapshot.totals.webhook_failed,
      retry_count: metricSnapshot.totals.retry_count,
      dlq_size:
        metricSnapshot.totals.dlq_size ||
        ((queueStats?.dlq?.waiting || 0) +
          (queueStats?.dlq?.active || 0) +
          (queueStats?.dlq?.delayed || 0)),
      stuck_orders_count: getGaugeValue("stuck_orders_count"),
    },
    queueStats,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// Sentry error handler - must come before other error handlers
app.use(sentryErrorHandler);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
