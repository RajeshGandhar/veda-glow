import { HttpError } from "../utils/httpError.js";
import { getAdminSessionTokenFromRequest, verifyAdminSessionToken } from "../utils/adminSession.js";

export function requireAdminAuth(req, _res, next) {
  const token = getAdminSessionTokenFromRequest(req);
  const payload = verifyAdminSessionToken(token);

  if (!payload) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  req.admin = {
    role: payload.role,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };

  next();
}
