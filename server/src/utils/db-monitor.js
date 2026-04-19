/**
 * Database Connection Pool Monitoring
 *
 * Provides utilities to monitor and log database connection pool health
 *
 * Usage:
 *   import { startPoolMonitoring } from './db-monitor.js';
 *   startPoolMonitoring(); // Logs every 60 seconds
 */

import mongoose from "mongoose";
import { getDatabaseStats, healthCheck } from "../config/db.js";

let monitoringInterval = null;

/**
 * Start periodic monitoring of database connection pool
 *
 * @param {number} intervalMs - Interval between checks (default: 60000ms = 1 minute)
 * @param {boolean} verbose - Log every check (default: false, only log on changes)
 */
export function startPoolMonitoring(intervalMs = 60000, verbose = false) {
  if (monitoringInterval) {
    console.warn("⚠️  Pool monitoring already started");
    return;
  }

  console.log(
    `📊 Starting database pool monitoring (every ${intervalMs / 1000}s)`,
  );

  // Get previous state for change detection
  let previousState = getPoolMetrics();

  monitoringInterval = setInterval(async () => {
    const currentState = getPoolMetrics();
    const healthStatus = await healthCheck();

    // Only log on changes or if verbose mode
    const hasChanged =
      JSON.stringify(previousState) !== JSON.stringify(currentState);

    if (hasChanged || verbose) {
      logPoolStatus(currentState, healthStatus);
      previousState = currentState;
    }
  }, intervalMs);

  // Allow stopping interval
  return {
    stop: () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        console.log("🛑 Pool monitoring stopped");
      }
    },
  };
}

/**
 * Get current pool metrics
 */
function getPoolMetrics() {
  try {
    const stats = getDatabaseStats();
    return {
      connectionState: getConnectionStateName(stats.state),
      collections: stats.collections,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connectionState: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Convert connection state number to readable name
 */
function getConnectionStateName(state) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[state] || "unknown";
}

/**
 * Log pool status with formatting
 */
function logPoolStatus(metrics, healthStatus) {
  const icon = healthStatus.ok ? "✅" : "❌";
  const status = metrics.connectionState.toUpperCase();

  console.log(
    `${icon} [${metrics.timestamp}] DB: ${status} (${healthStatus.message})`,
  );

  if (!healthStatus.ok) {
    console.warn(`   Error: ${healthStatus.message}`);
  }
}

/**
 * Get detailed pool information
 */
export function getPoolInfo() {
  try {
    const stats = getDatabaseStats();
    const db = mongoose.connection;

    return {
      status: getConnectionStateName(stats.state),
      database: stats.database,
      host: stats.host,
      collections: stats.collections,
      poolSize: stats.poolSize,
      availableConnections: stats.availableConnections,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
    };
  }
}

/**
 * Create middleware for pool health monitoring
 * Logs connection stats with each request (useful for development)
 */
export function poolMonitoringMiddleware(req, res, next) {
  // Add pool stats to response headers (for debugging)
  const info = getPoolInfo();

  res.set("X-DB-Status", info.status);
  res.set("X-DB-Collections", info.collections);

  // Log on errors
  res.on("finish", () => {
    if (res.statusCode >= 500 && info.status !== "connected") {
      console.warn(`⚠️  500 error with DB status: ${info.status}`);
    }
  });

  next();
}

export default {
  startPoolMonitoring,
  getPoolInfo,
  poolMonitoringMiddleware,
};
