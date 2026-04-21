import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import * as Sentry from "@sentry/react";

// Wrap App with Sentry's profiler for performance monitoring
const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SentryApp />
  </StrictMode>,
);
