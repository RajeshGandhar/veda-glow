import { HttpError } from "../utils/httpError.js";
import {
  getOrderAccessTokenFromRequest,
  verifyOrderAccessToken,
} from "../utils/orderAccess.js";

export function requireOrderAccess(req, _res, next) {
  const token = getOrderAccessTokenFromRequest(req);
  const payload = verifyOrderAccessToken(token);

  if (!payload) {
    next(new HttpError(401, "Unauthorized order access."));
    return;
  }

  if (payload.key !== req.params.idempotencyKey) {
    next(new HttpError(403, "Order token does not match requested order."));
    return;
  }

  req.orderAccess = {
    idempotencyKey: payload.key,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };

  next();
}
