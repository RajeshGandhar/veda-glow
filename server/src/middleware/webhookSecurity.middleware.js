import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

function normalizeIp(ip = "") {
  if (!ip) return "";
  return ip.replace(/^::ffff:/, "").trim();
}

export function protectWebhookIngress(req, _res, next) {
  const signature = req.get("x-razorpay-signature");
  if (!signature) {
    next(new HttpError(400, "Missing Razorpay signature header."));
    return;
  }

  if (!env.WEBHOOK_TRUSTED_IPS) {
    next();
    return;
  }

  const trustedIps = env.WEBHOOK_TRUSTED_IPS.split(",")
    .map((ip) => normalizeIp(ip))
    .filter(Boolean);

  if (trustedIps.length === 0) {
    next();
    return;
  }

  const clientIp = normalizeIp(req.ip);
  if (!trustedIps.includes(clientIp)) {
    next(new HttpError(403, "Webhook source IP not allowed."));
    return;
  }

  next();
}
