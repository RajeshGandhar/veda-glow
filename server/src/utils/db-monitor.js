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
        console.log("🛑 Database pool monitoring stopped");
      }
    },
  };
}

function getPoolMetrics() {
  const conn = mongoose.connection;
  return {
    readyState: conn.readyState,
    name: conn.name,
    host: conn.host,
    port: conn.port,
    poolSize: conn.db?.serverConfig?.poolSize || 0,
    connections: {
      inUse: conn.db?.serverConfig?.connections?.inUse || 0,
      inPool: conn.db?.serverConfig?.connections?.inPool || 0,
      pending: conn.db?.serverConfig?.connections?.pending || 0,
    },
  };
}

function logPoolStatus(metrics, healthStatus) {
  const status = healthStatus.healthy ? "✅" : "❌";
  console.log(
    `${status} DB Pool: ${metrics.connections.inUse}/${metrics.poolSize} connections | Pending: ${metrics.connections.pending} | State: ${getReadyStateLabel(metrics.readyState)}`,
  );
}

function getReadyStateLabel(state) {
  switch (state) {
    case 0: return "disconnected";
    case 1: return "connected";
    case 2: return "connecting";
    case 3: return "disconnecting";
    default: return "unknown";
  }
}