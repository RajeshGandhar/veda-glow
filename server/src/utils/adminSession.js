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

export function createAdminSessionToken(adminId = "admin") {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    v: TOKEN_VERSION,
    typ: "admin_session",
    sub: adminId,
    iat: nowSeconds,
    exp: nowSeconds + 24 * 60 * 60, // 24 hours
    nonce: crypto.randomUUID(),
  };
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payloadBase64, signature] = token.split(".");

  try {
    const payload = JSON.parse(base64UrlDecode(payloadBase64));
    if (payload.v !== TOKEN_VERSION || payload.typ !== "admin_session")
      return null;

    const expectedSignature = createSignature(payloadBase64);
    if (!timingSafeEqual(expectedSignature, signature)) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getAdminSessionTokenFromRequest(req) {
  // Check cookie first, then header
  const cookies = parseCookies(req.get("cookie"));
  return cookies.admin_session || req.get("x-admin-session-token");
}

export function setAdminSessionCookie(res, token, options = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  };

  res.setHeader(
    "Set-Cookie",
    serializeCookie("admin_session", token, cookieOptions),
  );
}

export function clearAdminSessionCookie(res) {
  setAdminSessionCookie(res, "", { maxAge: 0 });
}
