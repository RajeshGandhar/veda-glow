import { HttpError } from "../utils/httpError.js";
import { getAdminSessionTokenFromRequest, verifyAdminSessionToken } from "../utils/adminSession.js";
import { env } from "../config/env.js";

export function requireAdminAuth(req, _res, next) {
  const token = getAdminSessionTokenFromRequest(req);
  
  // Debug logging for authentication failures (only in development)
  if (!token && env.NODE_ENV !== "production") {
    console.warn("[Auth Debug] No token found in request", {
      cookies: req.headers.cookie ? "present" : "missing",
      customHeader: req.headers["x-admin-session-token"] ? "present" : "missing",
      origin: req.headers.origin,
      referer: req.headers.referer,
    });
  }

  const payload = verifyAdminSessionToken(token);

  if (!payload) {
    // Debug logging for token verification failures (only in development)
    if (env.NODE_ENV !== "production" && token) {
      console.warn("[Auth Debug] Token verification failed", {
        tokenPresent: !!token,
        tokenLength: token?.length,
        origin: req.headers.origin,
      });
    }
    
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  req.admin = {
    role: payload.role || "admin",
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };

  next();
}
