import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "CREATE_COUPON",
        "UPDATE_COUPON",
        "DELETE_COUPON",
        "UPDATE_ORDER_STATUS",
        "UPDATE_ORDER_PAYMENT_STATUS",
      ],
      index: true,
    },
    resourceType: {
      type: String,
      enum: ["COUPON", "ORDER"],
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Index for querying recent audit logs by admin
auditLogSchema.index({ admin: 1, createdAt: -1 });
// Index for querying audit logs by action
auditLogSchema.index({ action: 1, createdAt: -1 });
// Index for TTL - keep audit logs for 90 days in production
if (process.env.NODE_ENV === "production") {
  auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
}

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
