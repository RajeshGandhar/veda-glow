import { Router } from "express";
import { validateCoupon } from "../controllers/coupon.controller.js";
import { couponValidationLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/validate", couponValidationLimiter, validateCoupon);

export default router;
