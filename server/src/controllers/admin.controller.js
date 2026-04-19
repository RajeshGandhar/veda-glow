import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { logAuditEvent } from "../utils/auditLog.js";
import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  setAdminSessionCookie,
} from "../utils/adminSession.js";
import { listOrdersQuerySchema } from "../validations/order.validation.js";
import {
  adminLoginSchema,
  updateAdminOrderStatusSchema,
} from "../validations/admin.validation.js";

function serializeOrderForAdmin(order) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber ?? null,
    name: order.name,
    email: order.email ?? "",
    phone: order.phone,
    city: order.city ?? "",
    state: order.state ?? "",
    pincode: order.pincode ?? "",
    address: order.address,
    quantity: order.qty,
    totalPrice: order.amount,
    paymentMethod: order.paymentType,
    paymentStatus: order.paymentStatus,
    status: order.orderStatus,
    couponCode: order.couponCode ?? null,
    discountAmount: order.discountAmount ?? 0,
    couponCreatedBy: order.couponCreatedBy ?? "",
    trackingNumber: order.trackingNumber ?? "",
    courierName: order.courierName ?? "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchFilter(rawSearch) {
  if (!rawSearch) return null;
  const search = rawSearch.trim();
  if (!search) return null;

  const digitsOnly = search.replace(/\D/g, "");

  // If input is purely digits, search phone only
  if (/^\d+$/.test(search)) {
    return { phone: { $regex: escapeRegex(digitsOnly) } };
  }

  // Otherwise search name, phone, city, address
  const safeSearch = escapeRegex(search);
  const conditions = [
    { name: { $regex: safeSearch, $options: "i" } },
    { city: { $regex: safeSearch, $options: "i" } },
    { address: { $regex: safeSearch, $options: "i" } },
  ];
  if (digitsOnly) {
    conditions.push({ phone: { $regex: escapeRegex(digitsOnly) } });
  }

  return { $or: conditions };
}

export const adminLogin = asyncHandler(async (req, res) => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH) {
    throw new HttpError(
      503,
      "Admin login is disabled. Configure ADMIN_EMAIL and ADMIN_PASSWORD_HASH on the server.",
    );
  }

  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid admin login payload.");
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = env.ADMIN_EMAIL.trim().toLowerCase();
  const validEmail = normalizedEmail === expectedEmail;
  const validPassword = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);

  if (!validEmail || !validPassword) {
    // Log failed login attempt
    await logAuditEvent(
      {
        admin: normalizedEmail,
        action: "LOGIN",
        resourceType: null,
        resourceId: null,
        status: "FAILURE",
        errorMessage: "Invalid credentials",
      },
      req,
    );
    throw new HttpError(401, "Invalid credentials");
  }

  const token = createAdminSessionToken();
  setAdminSessionCookie(res, token);

  // Log successful login
  await logAuditEvent(
    {
      admin: normalizedEmail,
      action: "LOGIN",
      resourceType: null,
      resourceId: null,
      status: "SUCCESS",
    },
    req,
  );

  res.status(200).json({
    success: true,
    message: "Admin login successful.",
  });
});

export const adminLogout = asyncHandler(async (req, res) => {
  clearAdminSessionCookie(res);

  // Log logout
  await logAuditEvent(
    {
      admin: req.admin?.role || "unknown",
      action: "LOGOUT",
      resourceType: null,
      resourceId: null,
      status: "SUCCESS",
    },
    req,
  );

  res.status(200).json({
    success: true,
    message: "Logged out.",
  });
});

export const adminMe = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      role: "admin",
    },
  });
});

export const listAdminOrders = asyncHandler(async (req, res) => {
  const parsedQuery = listOrdersQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    throw new HttpError(400, "Invalid list orders query.");
  }

  const { page, limit, search, orderStatus, paymentStatus } = parsedQuery.data;

  const filter = {};
  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  const searchFilter = buildSearchFilter(search);
  if (searchFilter) {
    Object.assign(filter, searchFilter);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    orders: orders.map(serializeOrderForAdmin),
    total,
    page,
    limit,
    hasMore: skip + orders.length < total,
  });
});

export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new HttpError(400, "Invalid order id.");
  }

  const parsedBody = updateAdminOrderStatusSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new HttpError(400, "Invalid status payload.");
  }

  const { status } = parsedBody.data;
  const existing = await Order.findById(req.params.id);
  if (!existing) {
    throw new HttpError(404, "Order not found.");
  }

  const now = new Date();
  const nextFields = { orderStatus: status };

  if (status === "pending" || status === "confirmed") {
    nextFields.shippedAt = null;
    nextFields.deliveredAt = null;
  } else if (status === "shipped") {
    nextFields.shippedAt = existing.shippedAt || now;
    nextFields.deliveredAt = null;
  } else if (status === "delivered") {
    nextFields.shippedAt = existing.shippedAt || now;
    nextFields.deliveredAt = existing.deliveredAt || now;
  }

  const updated = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: nextFields },
    { new: true },
  );

  if (!updated) {
    throw new HttpError(404, "Order not found.");
  }

  // Log order status update to audit trail
  await logAuditEvent(
    {
      admin: req.admin?.role || "admin",
      action: "UPDATE_ORDER_STATUS",
      resourceType: "ORDER",
      resourceId: updated._id.toString(),
      changes: {
        orderStatus: { from: existing.orderStatus, to: updated.orderStatus },
        orderNumber: updated.orderNumber,
      },
    },
    req,
  );

  console.info("[Admin] Updated order status", {
    orderId: updated._id.toString(),
    status: updated.orderStatus,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Order status updated.",
    order: serializeOrderForAdmin(updated),
  });
});
