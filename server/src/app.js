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

// CSRF validation middleware for state-changing operations
app.use((req, res, next) => {
  // Apply CSRF validation to POST, PATCH, DELETE requests
  if (["POST", "PATCH", "DELETE"].includes(req.method)) {
    // Verify request origin matches allowed origins
    const origin = req.get("origin") || req.get("referer");
    if (origin) {
      const originUrl = new URL(origin, "http://localhost").origin;
      const isAllowed = allowedOrigins.some(
        (o) => new URL(o, "http://localhost").origin === originUrl,
      );
      if (!isAllowed) {
        return res
          .status(403)
          .json({ message: "CSRF validation failed: Invalid origin" });
      }
    }
  }
  next();
});

app.get("/api/health", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const statusCode = dbReady ? 200 : 503;

  res.status(statusCode).json({
    status: dbReady ? "ok" : "degraded",
    database: dbReady ? "connected" : "disconnected",
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
