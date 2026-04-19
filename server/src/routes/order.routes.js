import { Router } from "express";
import {
  createOrder,
  verifyOrderPayment,
} from "../controllers/order.controller.js";
import {
  createOrderLimiter,
  verifyPaymentLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/", createOrderLimiter, createOrder);
// SECURITY FIX: Use idempotencyKey (opaque identifier) instead of MongoDB ID
// prevents information enumeration of order counts and IDs
router.post(
  "/:idempotencyKey/verify-payment",
  verifyPaymentLimiter,
  verifyOrderPayment,
);

export default router;
