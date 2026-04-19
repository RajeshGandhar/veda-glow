import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/payment.controller.js";
import { webhookLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/webhook", webhookLimiter, handleRazorpayWebhook);

export default router;
