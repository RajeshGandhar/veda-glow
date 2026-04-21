import cron from "node-cron";
import { getStuckOrders } from "../services/paymentReconciliation.service.js";
import { logStructured } from "../utils/observability.js";

const RECONCILIATION_CRON = "0 */6 * * *"; // Every 6 hours

console.log("🔄 Starting payment reconciliation job...");

cron.schedule(RECONCILIATION_CRON, async () => {
  logStructured("info", "Starting payment reconciliation");

  try {
    const stuckOrders = await getStuckOrders();

    if (stuckOrders.length === 0) {
      logStructured("info", "No stuck orders found");
      return;
    }

    logStructured("warn", "Found stuck orders", {
      count: stuckOrders.length,
      orders: stuckOrders.map((o) => o._id),
    });

    // Process stuck orders
    for (const order of stuckOrders) {
      try {
        // Implement reconciliation logic here
        // For example, check with Razorpay API for payment status
        logStructured("info", "Processing stuck order", {
          orderId: order._id,
          paymentStatus: order.paymentStatus,
        });

        // Placeholder: In real implementation, you'd verify with payment gateway
        // and update order status accordingly
      } catch (error) {
        logStructured("error", "Failed to reconcile order", {
          orderId: order._id,
          error: error.message,
        });
      }
    }
  } catch (error) {
    logStructured("error", "Payment reconciliation failed", {
      error: error.message,
    });
  }
});

console.log(`⏰ Reconciliation job scheduled: ${RECONCILIATION_CRON}`);

export function startReconciliationScheduler() {
  // Already started when imported
  return { stop: () => cron.destroy() };
}

export function stopReconciliationScheduler() {
  cron.destroy();
}

process.on("SIGTERM", () => {
  console.log("🛑 Reconciliation job stopped");
  cron.destroy();
  process.exit(0);
});
