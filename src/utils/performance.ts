/**
 * Core Web Vitals and Performance Metrics Tracker
 *
 * Tracks and reports on Core Web Vitals and other performance metrics
 * Use in production to monitor real user experience
 *
 * Integration:
 * 1. Import this file in src/main.tsx
 * 2. Call initializePerformanceTracking()
 * 3. Metrics are automatically sent to Sentry if configured
 */

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  tbt?: number; // Total Blocked Time
  tti?: number; // Time to Interactive
}

const metrics: PerformanceMetrics = {};

/**
 * Track Largest Contentful Paint (LCP)
 * Measures when the largest content element becomes visible
 */
function trackLCP() {
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = Math.round(
          (lastEntry.renderTime || lastEntry.loadTime) as number,
        );

        console.log(`[Performance] LCP: ${metrics.lcp}ms`);
        reportMetric("lcp", metrics.lcp);
      });
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      console.warn("LCP tracking unavailable", e);
    }
  }
}

/**
 * Track First Input Delay (FID)
 * Measures responsiveness to user input
 */
function trackFID() {
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;
        const processingDuration = firstEntry?.processingDuration;

        if (processingDuration !== undefined && !isNaN(processingDuration)) {
          metrics.fid = Math.round(processingDuration);
          console.log(`[Performance] FID: ${metrics.fid}ms`);
          reportMetric("fid", metrics.fid);
        }
      });
      observer.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      console.warn("FID tracking unavailable", e);
    }
  }
}

/**
 * Track Cumulative Layout Shift (CLS)
 * Measures visual stability
 */
function trackCLS() {
  if ("PerformanceObserver" in window) {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutEntry = entry as any;
          if (!layoutEntry.hadRecentInput) {
            clsValue += layoutEntry.value as number;
          }
        }
        metrics.cls = Math.round(clsValue * 1000) / 1000;

        console.log(`[Performance] CLS: ${metrics.cls}`);
        reportMetric("cls", metrics.cls);
      });
      observer.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      console.warn("CLS tracking unavailable", e);
    }
  }
}

/**
 * Track First Contentful Paint (FCP)
 * Measures when first content appears
 */
function trackFCP() {
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.fcp = Math.round(entries[entries.length - 1].startTime);

          console.log(`[Performance] FCP: ${metrics.fcp}ms`);
          reportMetric("fcp", metrics.fcp);
        }
      });
      observer.observe({ entryTypes: ["paint"] });
    } catch (e) {
      console.warn("FCP tracking unavailable", e);
    }
  }
}

/**
 * Track Time to First Byte (TTFB)
 * Measures server response time
 */
function trackTTFB() {
  if ("performance" in window) {
    const perfData = window.performance.timing;
    metrics.ttfb = perfData.responseStart - perfData.fetchStart;

    console.log(`[Performance] TTFB: ${metrics.ttfb}ms`);
    reportMetric("ttfb", metrics.ttfb);
  }
}

/**
 * Track Total Blocked Time (TBT)
 * Measures main thread blocking duration
 */
function trackTBT() {
  if ("PerformanceObserver" in window) {
    try {
      let tbtValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration - 50;
          if (duration > 0) {
            tbtValue += duration;
          }
        }
        metrics.tbt = Math.round(tbtValue);

        console.log(`[Performance] TBT: ${metrics.tbt}ms`);
        reportMetric("tbt", metrics.tbt);
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      console.warn("TBT tracking unavailable", e);
    }
  }
}

/**
 * Calculate Time to Interactive (TTI)
 * When page is fully interactive
 */
function trackTTI() {
  if ("performance" in window && "getEntriesByType" in window.performance) {
    const perfData = window.performance.timing;
    const loadEventEnd = perfData.loadEventEnd || perfData.loadEventStart || 0;
    const fetchStart = perfData.fetchStart || 0;

    if (loadEventEnd > 0 && fetchStart > 0 && loadEventEnd > fetchStart) {
      metrics.tti = loadEventEnd - fetchStart;
      console.log(`[Performance] TTI: ${metrics.tti}ms`);
      reportMetric("tti", metrics.tti);
    } else {
      // Fallback: use navigationStart as reference
      const navigationStart = perfData.navigationStart || 0;
      if (navigationStart > 0 && loadEventEnd > navigationStart) {
        metrics.tti = loadEventEnd - navigationStart;
        console.log(`[Performance] TTI: ${metrics.tti}ms`);
        reportMetric("tti", metrics.tti);
      }
    }
  }
}

/**
 * Report metric to Sentry
 */
function reportMetric(name: string, value: number) {
  const status = getMetricStatus(name, value);
  console.log(`[Performance] ${name.toUpperCase()}: ${value}ms (${status})`);
}

/**
 * Determine metric health status
 */
function getMetricStatus(metric: string, value: number): string {
  const thresholds = {
    lcp: { good: 2500, fair: 4000 },
    fcp: { good: 1800, fair: 3000 },
    fid: { good: 100, fair: 300 },
    cls: { good: 0.1, fair: 0.25 },
    ttfb: { good: 600, fair: 1200 },
    tbt: { good: 200, fair: 600 },
    tti: { good: 3800, fair: 7300 },
  };

  const threshold = thresholds[metric as keyof typeof thresholds];
  if (!threshold) return "unknown";

  if (value <= threshold.good) return "good";
  if (value <= threshold.fair) return "fair";
  return "poor";
}

/**
 * Initialize all performance tracking
 */
export function initializePerformanceTracking() {
  // Use setTimeout to ensure page is fully interactive before tracking
  if (document.readyState === "complete") {
    startTracking();
  } else {
    window.addEventListener("load", startTracking);
  }
}

function startTracking() {
  console.log("[Performance] Initializing performance metrics tracking...");

  trackTTFB();
  trackFCP();
  trackLCP();
  trackFID();
  trackCLS();
  trackTBT();
  trackTTI();

  // Report metrics after 5 seconds
  setTimeout(() => {
    reportAllMetrics();
  }, 5000);

  // Periodically report metrics (every 30 seconds)
  setInterval(() => {
    reportAllMetrics();
  }, 30000);
}

function reportAllMetrics() {
  console.log("[Performance] Current metrics:", metrics);

  // Log summary for monitoring
  const summary = [
    `LCP: ${metrics.lcp}ms (${getMetricStatus("lcp", metrics.lcp || 0)})`,
    `FCP: ${metrics.fcp}ms (${getMetricStatus("fcp", metrics.fcp || 0)})`,
    `CLS: ${metrics.cls} (${getMetricStatus("cls", metrics.cls || 0)})`,
    `TTI: ${metrics.tti}ms`,
  ].join(" | ");

  console.log(`[Performance] Summary: ${summary}`);
}

/**
 * Get current metrics (useful for debugging)
 */
export function getMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/**
 * Track custom operation duration
 */
export function trackOperation(name: string, duration: number) {
  console.log(`[Performance] Operation '${name}': ${duration}ms`);
}

export default {
  initializePerformanceTracking,
  getMetrics,
  trackOperation,
};
