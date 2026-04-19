import crypto from "crypto";
import { env } from "../config/env.js";

const TOKEN_VERSION = 1;

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSignature(payloadBase64) {
  const secret = env.ADMIN_SESSION_SECRET || env.JWT_SECRET;
  return crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");
}

function timingSafeEqual(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  if (options.httpOnly) segments.push("HttpOnly");
  if (options.secure) segments.push("Secure");
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
  if (options.path) segments.push(`Path=${options.path}`);
  if (typeof options.maxAge === "number") {
    segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  return segments.join("; ");
}

function parseCookies(cookieHeader = "") {
  const result = {};
  if (!cookieHeader) return result;

  for (const pair of cookieHeader.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!key) continue;
    result[key] = decodeURIComponent(value);
  }

  return result;
}

export function createAdminSessionToken() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = nowSeconds + env.ADMIN_SESSION_TTL_HOURS * 60 * 60;
  const payload = {
    v: TOKEN_VERSION,
    role: "admin",
    iat: nowSeconds,
    exp: expiresAtSeconds,
    nonce: crypto.randomUUID(),
  };
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = createSignature(payloadBase64);
  if (!timingSafeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadBase64));
    if (payload.role !== "admin") return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(res, token) {
  const maxAgeSeconds = env.ADMIN_SESSION_TTL_HOURS * 60 * 60;
  const cookie = serializeCookie(env.ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true, // Always true for production cross-origin
    sameSite: "None", // Required for cross-origin cookies
    path: "/",
    maxAge: maxAgeSeconds,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearAdminSessionCookie(res) {
  const cookie = serializeCookie(env.ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true, // Always true for production cross-origin
    sameSite: "None", // Required for cross-origin cookies
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function getAdminSessionTokenFromRequest(req) {
  const cookies = parseCookies(req.headers?.cookie || "");
  return cookies[env.ADMIN_COOKIE_NAME] || "";
}
