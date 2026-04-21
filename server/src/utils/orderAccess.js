import crypto from "crypto";
import { env } from "../config/env.js";

const TOKEN_VERSION = 1;
const DEFAULT_TTL_MINUTES = 30;

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignature(payloadBase64) {
  const secret = env.ORDER_ACCESS_SECRET || env.JWT_SECRET;
  return crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");
}

function timingSafeEqual(a, b) {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function createOrderAccessToken(idempotencyKey) {
  const ttlMinutes = Number.isFinite(env.ORDER_ACCESS_TTL_MINUTES)
    ? env.ORDER_ACCESS_TTL_MINUTES
    : DEFAULT_TTL_MINUTES;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    v: TOKEN_VERSION,
    typ: "order_access",
    key: idempotencyKey,
    iat: nowSeconds,
    exp: nowSeconds + ttlMinutes * 60,
    nonce: crypto.randomUUID(),
  };
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyOrderAccessToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payloadBase64, signature] = token.split(".");

  try {
    const payload = JSON.parse(base64UrlDecode(payloadBase64));
    if (payload.v !== TOKEN_VERSION || payload.typ !== "order_access") return null;

    const expectedSignature = createSignature(payloadBase64);
    if (!timingSafeEqual(expectedSignature, signature)) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getOrderAccessTokenFromRequest(req) {
  // Check query param first, then header
  return req.query.token || req.get("x-order-access-token");
}