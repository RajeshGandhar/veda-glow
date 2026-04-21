import { Router } from "express";
import {
  createOrder,
  getOrder,
  verifyPayment,
} from "../controllers/order.controller.js";
import { createOrderLimiter } from "../middleware/rateLimit.middleware.js";
import { requireOrderAccess } from "../middleware/orderAccess.middleware.js";

const router = Router();

router.post("/", createOrderLimiter, createOrder);
router.post("/:idempotencyKey/verify", verifyPayment);
// SECURITY FIX: Use idempotencyKey (opaque identifier) instead of MongoDB ID
// prevents information enumeration of order counts and IDs
router.get("/:idempotencyKey", requireOrderAccess, getOrder);

export default router;
