import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  adminMe,
  adminMetrics,
  listAdminOrders,
  replayDlqEvent,
  updateAdminOrderStatus,
  getAutoRecoveryStatus,
  triggerRecovery,
} from "../controllers/admin.controller.js";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listCouponUsages,
} from "../controllers/coupon.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";
import {
  adminLoginLimiter,
  adminWriteLimiter,
  adminReadLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = Router();

// Auth
router.post("/login", adminLoginLimiter, adminLogin);
router.post("/logout", requireAdminAuth, adminLogout);
router.get("/me", requireAdminAuth, adminMe);

// Orders
router.get("/orders", requireAdminAuth, adminReadLimiter, listAdminOrders);
router.get("/metrics", requireAdminAuth, adminReadLimiter, adminMetrics);
router.post("/dlq/replay", requireAdminAuth, adminWriteLimiter, replayDlqEvent);
router.patch(
  "/orders/:id/status",
  requireAdminAuth,
  adminWriteLimiter,
  updateAdminOrderStatus,
);

// Coupons
router.get("/coupons", requireAdminAuth, adminReadLimiter, listCoupons);
router.post("/coupons", requireAdminAuth, adminWriteLimiter, createCoupon);
router.patch("/coupons/:id", requireAdminAuth, adminWriteLimiter, updateCoupon);
router.delete(
  "/coupons/:id",
  requireAdminAuth,
  adminWriteLimiter,
  deleteCoupon,
);
router.get(
  "/coupons/usages",
  requireAdminAuth,
  adminReadLimiter,
  listCouponUsages,
);

// Auto-Recovery
router.get("/recovery/status", requireAdminAuth, adminReadLimiter, getAutoRecoveryStatus);
router.post("/recovery/trigger", requireAdminAuth, adminWriteLimiter, triggerRecovery);

export default router;
