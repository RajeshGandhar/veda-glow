import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * MongoDB Connection Pool Configuration
 *
 * Connection pooling reduces overhead of creating new connections
 * for each request. Recommended settings for production.
 */

// Connection pool defaults (tuned for production)
const POOL_CONFIG = {
  // Development: 5, Production: 10-25 (depending on server resources)
  maxPoolSize: env.NODE_ENV === "production" ? 15 : 5,

  // Number of connections to keep ready in the pool
  minPoolSize: env.NODE_ENV === "production" ? 5 : 2,

  // Time (ms) to wait for a connection from the pool before timeout
  waitQueueTimeoutMS: 10000,

  // Max time (ms) a connection can stay idle before being closed
  maxIdleTimeMS: 30000,

  // Connection timeout in milliseconds
  connectTimeoutMS: 10000,

  // Socket timeout in milliseconds (0 = infinite)
  socketTimeoutMS: 45000,

  // Enable server selection monitoring
  serverSelectionTimeoutMS: 10000,
};

/**
 * One-time index repair: drops the unique invoiceNumber_1 index if it exists.
 * invoiceNumber is not currently used, so unique constraint was causing issues.
 * Safe to run on every startup — no-ops if the index doesn't exist.
 */
async function repairIndexes() {
  try {
    const collection = mongoose.connection.collection("orders");
    const indexes = await collection.indexes();

    const invoiceIndex = indexes.find(
      (idx) => idx.name === "invoiceNumber_1" && idx.unique === true,
    );

    if (invoiceIndex) {
      await collection.dropIndex("invoiceNumber_1");
      console.log("🔧 Repaired: dropped unique invoiceNumber_1 index — will be recreated as non-unique");
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.warn("⚠️  Index repair check failed (non-fatal):", err.message);
  }
}

// Connection event handlers
function setupConnectionHandlers(connection) {
  connection.on("connected", () => {
    console.log("✅ MongoDB connected successfully");
  });

  connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  connection.on("error", (error) => {
    console.error("❌ MongoDB connection error:", error);
  });

  connection.on("reconnected", () => {
    console.log("🔄 MongoDB reconnected");
  });
}

/**
 * Connect to MongoDB with connection pooling
 */
export async function connectDatabase() {
  try {
    mongoose.set("strictQuery", true);

    // Validate URI is present before attempting connection
    if (!env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set. Check your environment variables.");
      process.exit(1);
    }

    // Log sanitized URI (hides password) for debugging
    const sanitizedUri = env.MONGODB_URI.replace(
      /\/\/([^:]+):([^@]+)@/,
      "//$1:****@"
    );
    console.log(`🔌 Connecting to MongoDB: ${sanitizedUri}`);

    // Display pool configuration in development
    if (env.NODE_ENV !== "production") {
      console.log("📊 MongoDB Pool Config:", POOL_CONFIG);
    }

    await mongoose.connect(env.MONGODB_URI, {
      ...POOL_CONFIG,
      retryWrites: true,
      w: "majority",
    });

    setupConnectionHandlers(mongoose.connection);

    // Repair any stale indexes from previous schema versions
    await repairIndexes();

    console.log("🗄️  MongoDB connection pool initialized");
    console.log(
      `   Pool size: ${POOL_CONFIG.minPoolSize}-${POOL_CONFIG.maxPoolSize} connections`,
    );

    return mongoose.connection;
  } catch (error) {
    // Provide actionable error messages per error type
    if (error.name === "MongoServerSelectionError") {
      const reason = error.reason?.servers
        ? JSON.stringify([...error.reason.servers.entries()].map(([k, v]) => ({
            host: k,
            error: v.error?.message,
          })))
        : error.message;

      if (error.message?.includes("ENOTFOUND")) {
        console.error("❌ DNS resolution failed. Possible causes:");
        console.error("   1. Atlas cluster is paused or deleted");
        console.error("   2. Wrong cluster hostname in MONGODB_URI");
        console.error("   3. No internet access from this server");
        console.error(`   Hostname attempted: ${env.MONGODB_URI.match(/@([^/]+)/)?.[1] ?? "unknown"}`);
      } else if (error.message?.includes("ECONNREFUSED")) {
        console.error("❌ Connection refused. Atlas IP whitelist may be blocking this server.");
        console.error("   Fix: Add 0.0.0.0/0 to Atlas Network Access.");
      } else if (error.message?.includes("Authentication failed")) {
        console.error("❌ Authentication failed. Check MONGODB_URI username/password.");
      } else {
        console.error("❌ MongoDB server selection failed:", reason);
      }
    } else {
      console.error("❌ Failed to connect to MongoDB:", error.message);
    }

    process.exit(1);
  }
}

/**
 * Get database connection stats
 */
export function getDatabaseStats() {
  const db = mongoose.connection;
  const client = db.getClient();

  const poolStats = client?.topology?.s?.pool || {};

  return {
    state: db.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    collections: db.collections.length,
    poolSize: poolStats.totalConnectionCount || "unknown",
    availableConnections: poolStats.availableConnectionCount || "unknown",
    host: db.host,
    database: db.name,
  };
}

/**
 * Health check for database connectivity
 */
export async function healthCheck() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { ok: false, message: "Database not connected" };
    }

    // Perform simple ping to verify connection
    await mongoose.connection.db.admin().ping();

    return { ok: true, message: "Database healthy" };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

/**
 * Graceful shutdown - close connection pool
 */
export async function closeDatabase() {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB connection pool closed");
  } catch (error) {
    console.error("❌ Error closing database:", error);
  }
}
