#!/usr/bin/env node

/**
 * Payment Flow Testing Script
 *
 * Usage:
 *   node server/tests/payment-flow.test.js [test-type]
 *
 * Test types:
 *   - health      : Check if API is running
 *   - order       : Create a test order (online payment)
 *   - cod-order   : Create a COD order
 *   - all         : Run all tests
 *
 * Example:
 *   node server/tests/payment-flow.test.js health
 *   node server/tests/payment-flow.test.js order
 */

import http from "http";

const API_URL = process.env.API_URL || "http://localhost:5000";
const TESTS = {
  HEALTH: "health",
  ORDER: "order",
  COD: "cod-order",
  ALL: "all",
};

// Color output helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testHealth() {
  log("\n🏥 Testing Health Check...", "cyan");

  try {
    const result = await makeRequest("GET", "/api/health");

    if (result.status === 200 && result.body.status === "ok") {
      log("✅ Health check passed", "green");
      log(`   Database: ${result.body.database}`, "green");
      log(`   Uptime: ${result.body.uptimeSeconds}s`, "green");
      return true;
    } else {
      log("❌ Health check failed", "red");
      log(`   Status: ${result.status}`, "red");
      log(`   Response: ${JSON.stringify(result.body)}`, "red");
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, "red");
    log(`   Make sure backend is running: npm run dev`, "yellow");
    return false;
  }
}

async function testOrderCreation(paymentType = "razorpay") {
  const typeLabel =
    paymentType === "razorpay" ? "Online Payment" : "Cash on Delivery";
  log(`\n📦 Testing ${typeLabel} Order Creation...`, "cyan");

  const idempotencyKey = `test-${paymentType}-${Date.now()}`;
  const orderData = {
    customer: {
      name: "Test User",
      email: "test@vedaglow.local",
      phone: "9876543210",
      address: "123 Test Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    items: [
      {
        id: "product_test",
        name: "Veda Glow Kit",
        price: 299,
        quantity: 1,
      },
    ],
    paymentType,
    idempotencyKey,
  };

  try {
    const result = await makeRequest("POST", "/api/orders", orderData);

    if (result.status === 201 || result.status === 200) {
      const order = result.body.order;
      log("✅ Order created successfully", "green");
      log(`   Order Number: ${order.orderNumber}`, "green");
      log(`   Order ID: ${order.id}`, "green");
      log(`   Amount: ₹${order.amount}`, "green");
      log(`   Payment Status: ${order.paymentStatus}`, "green");
      log(`   Razorpay Order ID: ${order.razorpayOrderId}`, "green");

      return { success: true, order };
    } else {
      log(`❌ Order creation failed (${result.status})`, "red");
      log(`   Response: ${JSON.stringify(result.body, null, 2)}`, "red");
      return { success: false };
    }
  } catch (error) {
    log(`❌ Order creation error: ${error.message}`, "red");
    return { success: false };
  }
}

async function runTests(testType = "all") {
  log("═══════════════════════════════════════", "blue");
  log("  Payment Flow Testing Script", "blue");
  log(`  API URL: ${API_URL}`, "blue");
  log(`  Time: ${new Date().toISOString()}`, "blue");
  log("═══════════════════════════════════════", "blue");

  let results = {};

  if (testType === TESTS.HEALTH || testType === TESTS.ALL) {
    results.health = await testHealth();
  }

  if (testType === TESTS.ORDER || testType === TESTS.ALL) {
    results.order = await testOrderCreation("razorpay");
  }

  if (testType === TESTS.COD || testType === TESTS.ALL) {
    results.cod = await testOrderCreation("cod");
  }

  // Summary
  log("\n═══════════════════════════════════════", "blue");
  log("  Test Summary", "blue");
  log("═══════════════════════════════════════", "blue");

  let passed = 0,
    failed = 0;
  for (const [test, success] of Object.entries(results)) {
    if (success === true) {
      log(`✅ ${test}`, "green");
      passed++;
    } else if (success === false) {
      log(`❌ ${test}`, "red");
      failed++;
    }
  }

  log(
    `\nTotal: ${passed} passed, ${failed} failed`,
    failed === 0 ? "green" : "red",
  );
  log("═══════════════════════════════════════\n", "blue");

  return failed === 0;
}

// Main
const testType = process.argv[2] || TESTS.ALL;

if (!Object.values(TESTS).includes(testType)) {
  log(`Invalid test type: ${testType}`, "red");
  log(
    "\nUsage: node server/tests/payment-flow.test.js [health|order|cod-order|all]",
    "yellow",
  );
  process.exit(1);
}

runTests(testType)
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    log(`Fatal error: ${error.message}`, "red");
    process.exit(1);
  });
