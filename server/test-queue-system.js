#!/usr/bin/env node

/**
 * Queue System Test Script
 * Tests Redis connection, queue operations, and webhook processing
 */

import { getRedisConnection, closeRedisConnection } from "./src/config/redis.js";
import { getPaymentWebhookQueue, closePaymentQueues } from "./src/queue/paymentWebhook.queue.js";
import { connectDatabase, closeDatabase } from "./src/config/db.js";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testRedisConnection() {
  log("\n📡 Testing Redis Connection...", "blue");
  
  try {
    const redis = getRedisConnection();
    await redis.connect();
    
    const pong = await redis.ping();
    if (pong === "PONG") {
      log("✅ Redis connection successful", "green");
    } else {
      throw new Error("Unexpected ping response");
    }
    
    // Test SET/GET
    await redis.set("test_key", "test_value");
    const value = await redis.get("test_key");
    
    if (value === "test_value") {
      log("✅ Redis SET/GET operations successful", "green");
    } else {
      throw new Error("SET/GET mismatch");
    }
    
    await redis.del("test_key");
    log("✅ Redis is ready for BullMQ", "green");
    
    return true;
  } catch (error) {
    log(`❌ Redis connection failed: ${error.message}`, "red");
    log("   Make sure Redis is running: sudo service redis-server start", "yellow");
    return false;
  }
}

async function testQueueOperations() {
  log("\n📦 Testing Queue Operations...", "blue");
  
  try {
    const queue = getPaymentWebhookQueue();
    
    // Add a test job
    const testJob = await queue.add(
      "test_webhook",
      {
        eventId: `test_${Date.now()}`,
        eventType: "payment.captured",
        eventTimestamp: Date.now(),
        correlationId: "test_correlation_id",
        razorpayOrderId: "order_test123",
        razorpayPaymentId: "pay_test123",
      },
      {
        jobId: `test_job_${Date.now()}`,
      }
    );
    
    log(`✅ Job added to queue: ${testJob.id}`, "green");
    
    // Check queue stats
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();
    
    log(`✅ Queue stats:`, "green");
    log(`   - Waiting: ${waiting}`, "reset");
    log(`   - Active: ${active}`, "reset");
    log(`   - Completed: ${completed}`, "reset");
    log(`   - Failed: ${failed}`, "reset");
    
    // Remove test job
    await testJob.remove();
    log("✅ Test job removed", "green");
    
    return true;
  } catch (error) {
    log(`❌ Queue operations failed: ${error.message}`, "red");
    return false;
  }
}

async function testDatabaseConnection() {
  log("\n🗄️  Testing Database Connection...", "blue");
  
  try {
    await connectDatabase();
    log("✅ MongoDB connection successful", "green");
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, "red");
    return false;
  }
}

async function runTests() {
  log("=".repeat(60), "blue");
  log("🧪 Queue System Test Suite", "blue");
  log("=".repeat(60), "blue");
  
  const results = {
    redis: false,
    queue: false,
    database: false,
  };
  
  // Test Redis
  results.redis = await testRedisConnection();
  
  // Test Queue (only if Redis works)
  if (results.redis) {
    results.queue = await testQueueOperations();
  } else {
    log("\n⏭️  Skipping queue tests (Redis not available)", "yellow");
  }
  
  // Test Database
  results.database = await testDatabaseConnection();
  
  // Summary
  log("\n" + "=".repeat(60), "blue");
  log("📊 Test Summary", "blue");
  log("=".repeat(60), "blue");
  
  log(`Redis Connection: ${results.redis ? "✅ PASS" : "❌ FAIL"}`, results.redis ? "green" : "red");
  log(`Queue Operations: ${results.queue ? "✅ PASS" : results.redis ? "❌ FAIL" : "⏭️  SKIPPED"}`, results.queue ? "green" : results.redis ? "red" : "yellow");
  log(`Database Connection: ${results.database ? "✅ PASS" : "❌ FAIL"}`, results.database ? "green" : "red");
  
  const allPassed = results.redis && results.queue && results.database;
  
  if (allPassed) {
    log("\n🎉 All tests passed! System is ready for queue-based processing.", "green");
    log("\nNext steps:", "blue");
    log("1. Update server/.env: ENABLE_EMBEDDED_PAYMENT_WORKER=true", "reset");
    log("2. Restart server: npm run dev", "reset");
    log("3. Monitor health endpoint: curl http://localhost:5000/api/health", "reset");
  } else {
    log("\n⚠️  Some tests failed. Please fix the issues before enabling queue processing.", "yellow");
    
    if (!results.redis) {
      log("\nTo fix Redis:", "yellow");
      log("  sudo apt-get install redis-server", "reset");
      log("  sudo service redis-server start", "reset");
    }
    
    if (!results.database) {
      log("\nTo fix Database:", "yellow");
      log("  Check MONGODB_URI in server/.env", "reset");
      log("  Ensure MongoDB is accessible", "reset");
    }
  }
  
  // Cleanup
  log("\n🧹 Cleaning up...", "blue");
  await closePaymentQueues();
  await closeRedisConnection();
  await closeDatabase();
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Unexpected error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
