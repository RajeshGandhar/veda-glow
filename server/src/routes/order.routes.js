import { Router } from "express";
import {
  createOrder,
  getOrder,
} from "../controllers/order.controller.js";
import { createOrderLimiter } from "../middleware/rateLimit.middleware.js";
import { requireOrderAccess } from "../middleware/orderAccess.middleware.js";

const router = Router();

router.post("/", createOrderLimiter, createOrder);
// SECURITY FIX: Use idempotencyKey (opaque identifier) instead of MongoDB ID
// prevents information enumeration of order counts and IDs
router.get("/:idempotencyKey", requireOrderAccess, getOrder);

export default router;
