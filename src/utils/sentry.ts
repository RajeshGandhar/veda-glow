import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for frontend error tracking and performance monitoring
 */
export const initializeSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn("VITE_SENTRY_DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    // Performance Monitoring (automatic)
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    // Other options
    beforeSend(event) {
      // Filter out errors in development
      if (import.meta.env.MODE === "development" && event.level === "error") {
        // Still capture errors, but you could return null to ignore
      }
      return event;
    },
  });
};

export default Sentry;
