import IORedis from "ioredis";
import { env } from "./env.js";

let redisConnection;
let connectionAttempted = false;

function buildRedisOptions() {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    username: env.REDIS_USERNAME || undefined,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true, // Don't connect immediately
    retryStrategy(times) {
      // Stop retrying after 3 attempts
      if (times > 3) {
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  };
}

export function getRedisConnection() {
  if (redisConnection) return redisConnection;
  
  if (!connectionAttempted) {
    connectionAttempted = true;
    redisConnection = new IORedis(buildRedisOptions());
    
    // Suppress connection errors when Redis features are disabled
    redisConnection.on('error', (err) => {
      if (!env.ENABLE_EMBEDDED_PAYMENT_WORKER && !env.ENABLE_RECONCILIATION_JOB) {
        // Silently ignore Redis errors when features are disabled
        // Only log once to avoid spam
        if (!connectionAttempted) {
          console.log('ℹ️  Redis not available (queue features disabled)');
        }
      } else {
        // Log errors when features are enabled
        console.error('Redis error:', err.message);
      }
    });
    
    // Suppress ready/connect logs when disabled
    if (!env.ENABLE_EMBEDDED_PAYMENT_WORKER && !env.ENABLE_RECONCILIATION_JOB) {
      redisConnection.on('ready', () => {
        // Silent
      });
      redisConnection.on('connect', () => {
        // Silent
      });
    }
  }
  
  return redisConnection;
}

export async function closeRedisConnection() {
  if (!redisConnection) return;
  await redisConnection.quit();
  redisConnection = null;
  connectionAttempted = false;
}
