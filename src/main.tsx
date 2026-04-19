import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeSentry } from "./utils/sentry";
import { initializePerformanceTracking } from "./utils/performance";
import * as Sentry from "@sentry/react";

// Initialize Sentry error tracking before rendering app
initializeSentry();

// Initialize performance metrics tracking
initializePerformanceTracking();

// Wrap App with Sentry's profiler for performance monitoring
const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SentryApp />
  </StrictMode>,
);
