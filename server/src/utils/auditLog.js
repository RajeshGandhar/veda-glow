import AuditLog from "../models/AuditLog.js";

/**
 * Log an admin action for audit trail and compliance
 */
export async function logAuditEvent(
  {
    admin,
    action,
    resourceType,
    resourceId,
    changes = {},
    status = "SUCCESS",
    errorMessage = null,
  },
  req = null,
) {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || "unknown";
    const userAgent = req?.get("user-agent") || "unknown";

    await AuditLog.create({
      admin,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress,
      userAgent,
      status,
      errorMessage,
    });
  } catch (error) {
    // Don't let audit logging failure break the request
    console.error("Failed to log audit event:", error);
  }
}
