import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  adminMe,
  listAdminOrders,
  updateAdminOrderStatus,
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

export default router;
