#!/usr/bin/env node
/**
 * Redis Connection Test Script
 * Run: node test-redis.js
 */

import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL;

console.log("🔍 Testing Redis Connection...\n");

const redis = new IORedis(
  REDIS_URL || {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  }
);

redis.on("connect", () => {
  console.log("✅ Connected to Redis");
  console.log(`   Host: ${REDIS_HOST}`);
  console.log(`   Port: ${REDIS_PORT}\n`);
});

redis.on("ready", async () => {
  console.log("✅ Redis is ready\n");

  try {
    // Test 1: PING
    console.log("📝 Test 1: PING");
    const pong = await redis.ping();
    console.log(`   Response: ${pong}\n`);

    // Test 2: SET/GET
    console.log("📝 Test 2: SET/GET");
    await redis.set("test:key", "Hello Redis!");
    const value = await redis.get("test:key");
    console.log(`   Stored: "Hello Redis!"`);
    console.log(`   Retrieved: "${value}"\n`);

    // Test 3: Check BullMQ queues
    console.log("📝 Test 3: Check BullMQ Queues");
    const keys = await redis.keys("bull:payment-webhook-queue:*");
    console.log(`   Found ${keys.length} queue keys`);
    if (keys.length > 0) {
      console.log(`   Keys: ${keys.slice(0, 5).join(", ")}${keys.length > 5 ? "..." : ""}\n`);
    } else {
      console.log(`   (No queue keys yet - this is normal if worker hasn't run)\n`);
    }

    // Test 4: Redis Info
    console.log("📝 Test 4: Redis Info");
    const info = await redis.info("server");
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
    const uptime = info.match(/uptime_in_seconds:([^\r\n]+)/)?.[1];
    console.log(`   Redis Version: ${version}`);
    console.log(`   Uptime: ${uptime} seconds\n`);

    // Cleanup
    await redis.del("test:key");

    console.log("✅ All tests passed!");
    console.log("\n🎉 Redis is working correctly!");
    console.log("\nNext steps:");
    console.log("  1. Start your server: npm run dev");
    console.log("  2. Check health: curl http://localhost:5000/api/health");
    console.log("  3. Test webhook: See REDIS_BULLMQ_SETUP.md\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
});

redis.on("error", (error) => {
  console.error("❌ Redis connection error:", error.message);
  console.error("\n🔧 Troubleshooting:");
  console.error("  1. Is Redis running? Check: redis-cli ping");
  console.error("  2. Start Redis: sudo systemctl start redis-server");
  console.error("  3. Check .env file for correct REDIS_HOST/PORT");
  console.error("  4. See REDIS_BULLMQ_SETUP.md for installation steps\n");
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error("❌ Connection timeout");
  console.error("   Redis is not responding. Check if it's running.");
  process.exit(1);
}, 10000);
