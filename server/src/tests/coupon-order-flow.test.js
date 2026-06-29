import assert from "node:assert/strict";
import test from "node:test";

const requiredEnv = {
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://127.0.0.1:27017/veda-glow-test",
  JWT_SECRET: "1234567890abcdef",
  JWT_EXPIRES_IN: "7d",
  FRONTEND_ORIGIN: "http://127.0.0.1:5173",
  RAZORPAY_KEY_ID: "rzp_test_key",
  RAZORPAY_KEY_SECRET: "rzp_test_secret",
};

for (const [key, value] of Object.entries(requiredEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const { validateCoupon } = await import("../controllers/coupon.controller.js");
const { createOrder } = await import("../controllers/order.controller.js");
const Coupon = (await import("../models/Coupon.js")).default;
const CouponUsage = (await import("../models/CouponUsage.js")).default;
const Order = (await import("../models/Order.js")).default;
const Counter = (await import("../models/Counter.js")).default;
const { razorpayClient } = await import("../config/razorpay.js");

function mockMethod(t, target, key, implementation) {
  const original = target[key];
  target[key] = implementation;
  t.after(() => {
    target[key] = original;
  });
}

function runHandler(handler, requestOverrides = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      ip: "127.0.0.1",
      get: () => "",
      ...requestOverrides,
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        if (settled) return this;
        settled = true;
        resolve({ statusCode: this.statusCode, body: payload });
        return this;
      },
    };

    const next = (error) => {
      if (settled) return;
      settled = true;
      if (error) {
        reject(error);
        return;
      }
      resolve({ statusCode: res.statusCode, body: null });
    };

    handler(req, res, next);
  });
}

function buildOrderDocument(payload) {
  const now = new Date();

  return {
    _id: {
      toString: () => "507f1f77bcf86cd799439011",
    },
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    pincode: payload.pincode,
    orderNotes: payload.orderNotes ?? "",
    qty: payload.qty,
    amount: payload.amount,
    couponCode: payload.couponCode ?? null,
    discountAmount: payload.discountAmount ?? 0,
    advanceAmount: payload.advanceAmount ?? 0,
    balanceDue: payload.balanceDue ?? 0,
    paymentType: payload.paymentType,
    paymentStatus: payload.paymentStatus ?? "created",
    orderStatus: payload.orderStatus ?? "pending",
    courierName: payload.courierName ?? "",
    trackingNumber: payload.trackingNumber ?? "",
    trackingUrl: payload.trackingUrl ?? "",
    shippedAt: payload.shippedAt ?? null,
    deliveredAt: payload.deliveredAt ?? null,
    razorpayOrderId: payload.razorpayOrderId ?? null,
    razorpayPaymentId: payload.razorpayPaymentId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

test("validateCoupon rejects coupon when per-user limit is reached", async (t) => {
  mockMethod(t, Coupon, "findOne", async () => ({
    _id: "coupon1",
    code: "ANIKA5",
    createdBy: "Anika Verma",
    discountPercent: 5,
    isActive: true,
    usedCount: 0,
    maxUses: null,
    maxUsesPerUser: 1,
    validFrom: null,
    validUntil: null,
  }));
  mockMethod(t, CouponUsage, "countDocuments", async () => 1);

  const response = await runHandler(validateCoupon, {
    body: {
      couponCode: "ANIKA5",
      items: [{ id: "veda-kit", quantity: 2 }],
      customer: {
        email: "customer@example.com",
        phone: "9876543210",
      },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.valid, false);
  assert.match(response.body.message, /maximum allowed times|already used/i);
});

test("createOrder applies coupon discount and tracks usage", async (t) => {
  let couponUsageCountCalls = 0;
  let couponUsageCreateCalls = 0;
  let couponUpdateCalls = 0;

  mockMethod(t, Counter, "findOneAndUpdate", async () => ({ seq: 1001 }));
  mockMethod(t, Coupon, "findOne", async () => ({
    _id: "coupon2",
    code: "ROHIT5",
    createdBy: "Rohit Kumar",
    discountPercent: 5,
    isActive: true,
    usedCount: 0,
    maxUses: 100,
    maxUsesPerUser: 1,
    validFrom: null,
    validUntil: null,
  }));
  mockMethod(t, CouponUsage, "countDocuments", async () => {
    couponUsageCountCalls += 1;
    return 0;
  });
  mockMethod(t, Order, "findOne", async () => null);
  mockMethod(t, Order, "create", async (payload) =>
    buildOrderDocument({
      ...payload,
      paymentStatus: "created",
      orderStatus: "pending",
    }),
  );
  mockMethod(t, CouponUsage, "create", async () => {
    couponUsageCreateCalls += 1;
    return { _id: "usage-record-1" };
  });
  mockMethod(t, Coupon, "updateOne", async () => {
    couponUpdateCalls += 1;
    return { acknowledged: true, matchedCount: 1 };
  });
  mockMethod(t, razorpayClient.orders, "create", async () => ({
    id: "order_rzp_123",
    amount: 12345,
    currency: "INR",
    receipt: "receipt_123",
    status: "created",
  }));

  const response = await runHandler(createOrder, {
    body: {
      customer: {
        name: "Test User",
        email: "test.user@example.com",
        phone: "9876543210",
        address: "123 Test Street, Near Park",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        orderNotes: "Leave at door",
      },
      items: [
        {
          id: "veda-kit",
          name: "VedaGlow 28-Day Kit",
          quantity: 2,
          price: 499,
        },
      ],
      paymentType: "razorpay",
      idempotencyKey: "checkout_test_123456789",
      couponCode: "ROHIT5",
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.order.couponCode, "ROHIT5");
  assert.ok(response.body.order.discountAmount > 0);
  assert.equal(response.body.razorpay.orderId, "order_rzp_123");
  assert.ok(couponUsageCountCalls >= 2);
  assert.equal(couponUsageCreateCalls, 1);
  assert.equal(couponUpdateCalls, 1);
});

test("createOrder blocks checkout when coupon per-user limit is exceeded", async (t) => {
  let razorpayCreateCalls = 0;
  let orderCreateCalls = 0;

  mockMethod(t, Coupon, "findOne", async () => ({
    _id: "coupon3",
    code: "PRIYA5",
    createdBy: "Priya Sharma",
    discountPercent: 5,
    isActive: true,
    usedCount: 2,
    maxUses: 100,
    maxUsesPerUser: 1,
    validFrom: null,
    validUntil: null,
  }));
  mockMethod(t, CouponUsage, "countDocuments", async () => 1);
  mockMethod(t, Order, "findOne", async () => null);
  mockMethod(t, Order, "create", async () => {
    orderCreateCalls += 1;
    return buildOrderDocument({});
  });
  mockMethod(t, razorpayClient.orders, "create", async () => {
    razorpayCreateCalls += 1;
    return {
      id: "order_rzp_blocked",
      amount: 12345,
      currency: "INR",
      receipt: "receipt_456",
      status: "created",
    };
  });

  await assert.rejects(
    runHandler(createOrder, {
      body: {
        customer: {
          name: "Repeat User",
          email: "repeat.user@example.com",
          phone: "9876543210",
          address: "456 Test Street, Near Mall",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          orderNotes: "",
        },
        items: [
          {
            id: "veda-kit",
            name: "VedaGlow 28-Day Kit",
            quantity: 1,
            price: 499,
          },
        ],
        paymentType: "razorpay",
        idempotencyKey: "checkout_test_987654321",
        couponCode: "PRIYA5",
      },
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /maximum allowed times|already used/i);
      return true;
    },
  );

  assert.equal(razorpayCreateCalls, 0);
  assert.equal(orderCreateCalls, 0);
});
