import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

/**
 * Initialize Sentry for backend error tracking and performance monitoring
 */
export const initializeSentry = () => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn("SENTRY_DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
};

/**
 * Sentry error handler middleware (attach to Express after routes)
 */
export const sentryErrorHandler = (err, req, res, next) => {
  Sentry.captureException(err);
  next(err);
};

/**
 * Sentry request handler middleware (attach to Express before routes)
 */
export const sentryRequestHandler = (req, res, next) => {
  next();
};

export default Sentry;
