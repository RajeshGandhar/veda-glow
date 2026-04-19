import crypto from "crypto";
import * as Sentry from "@sentry/node";

export function notFoundHandler(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Generate unique error ID for tracking and support
  const errorId = crypto.randomUUID();

  // Capture error in Sentry with error ID for correlation
  if (statusCode >= 500) {
    Sentry.captureException(error, {
      tags: { errorId },
      level: "error",
    });
  }

  res.status(statusCode).json({
    message:
      statusCode >= 500 && isProduction
        ? "Internal server error"
        : error.message || "Internal server error",
    ...(statusCode >= 500 ? { errorId } : {}), // Include error ID for server errors
    ...(error.details && !isProduction ? { details: error.details } : {}),
  });
}
