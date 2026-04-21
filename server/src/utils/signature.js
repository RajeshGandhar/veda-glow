import crypto from "crypto";
import { env } from "../config/env.js";

function toHexBuffer(value) {
  if (typeof value !== "string" || value.length % 2 !== 0) return null;
  if (!/^[a-fA-F0-9]+$/.test(value)) return null;
  return Buffer.from(value.toLowerCase(), "hex");
}

export function timingSafeEqualHex(a, b) {
  const aBuffer = toHexBuffer(a);
  const bBuffer = toHexBuffer(b);
  if (!aBuffer || !bBuffer) return false;
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function createRazorpayWebhookSignature(rawBodyBuffer) {
  return crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBodyBuffer)
    .digest("hex");
}

export function isValidRazorpayWebhookSignature(rawBodyBuffer, signature) {
  const expected = createRazorpayWebhookSignature(rawBodyBuffer);
  return timingSafeEqualHex(expected, signature);
}
