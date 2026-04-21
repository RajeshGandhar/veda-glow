import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// ============================================================================
// RATE LIMITER CONFIGURATION FOR PROXY ENVIRONMENTS
// ============================================================================
// IMPORTANT: This works in conjunction with app.set("trust proxy", 1)
//
// HOW IT WORKS:
// 1. express-rate-limit uses req.ip to identify clients
// 2. With "trust proxy: 1", req.ip reads from X-Forwarded-For header
// 3. This gives us the real client IP, not the proxy IP
//
// NGROK SCENARIO:
// - ngrok adds X-Forwarded-For: <real-client-ip>
// - Without trust proxy: req.ip = ngrok's IP (all requests look the same)
// - With trust proxy: req.ip = real client IP (proper rate limiting)
//
// PRODUCTION SCENARIO (Render, Heroku, VPS with nginx):
// - Load balancer/proxy adds X-Forwarded-For
// - Same behavior: trust proxy extracts real IP
// - Rate limiting works per actual user, not per proxy
//
// SECURITY NOTE:
// - standardHeaders: true (uses RateLimit-* headers, RFC standard)
// - legacyHeaders: false (disables X-RateLimit-* headers)
// - skipFailedRequests: false (count failed requests to prevent abuse)
// - skipSuccessfulRequests: false (count all requests)
//
function buildLimiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: { message },
    // Trust the IP from req.ip (which comes from X-Forwarded-For via trust proxy)
    // This is the default behavior, but explicitly documented here
    skipFailedRequests: false, // Count failed requests
    skipSuccessfulRequests: false, // Count successful requests
  });
}

export const createOrderLimiter = buildLimiter(
  15 * 60 * 1000,
  30,
  "Too many order attempts from this IP. Please try again in a few minutes.",
);

export const couponValidationLimiter = buildLimiter(
  15 * 60 * 1000,
  120,
  "Too many coupon validation requests. Please try again in a moment.",
);

export const webhookLimiter = buildLimiter(
  5 * 60 * 1000,
  300,
  "Webhook rate limit exceeded.",
);

export const adminLoginLimiter = buildLimiter(
  15 * 60 * 1000,
  12,
  "Too many admin login attempts. Please try again later.",
);

export const adminWriteLimiter = buildLimiter(
  15 * 60 * 1000,
  180,
  "Too many admin update requests. Please slow down.",
);

// SECURITY FIX: Rate limit on admin read operations (list endpoints)
export const adminReadLimiter = buildLimiter(
  15 * 60 * 1000,
  120,
  "Too many admin read requests. Please try again later.",
);
