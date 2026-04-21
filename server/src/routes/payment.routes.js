import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/payment.controller.js";
import { protectWebhookIngress } from "../middleware/webhookSecurity.middleware.js";

const router = Router();

router.post("/webhook", protectWebhookIngress, handleRazorpayWebhook);

export default router;
