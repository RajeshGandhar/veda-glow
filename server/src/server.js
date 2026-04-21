import app from "./app.js";
import { connectDatabase, closeDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSentry } from "./utils/sentry.js";
import { startPoolMonitoring } from "./utils/db-monitor.js";
import {
  closePaymentQueues,
  initializePaymentQueueEvents,
} from "./queue/paymentWebhook.queue.js";
import { closeRedisConnection } from "./config/redis.js";
import {
  startPaymentWebhookWorker,
  stopPaymentWebhookWorker,
} from "./workers/paymentWebhook.worker.js";
import {
  startReconciliationScheduler,
  stopReconciliationScheduler,
} from "./jobs/reconciliation.job.js";
import {
  startAutoRecovery,
  stopAutoRecovery,
} from "./services/autoRecovery.service.js";

// Initialize Sentry first
initializeSentry();

async function startServer() {
  await connectDatabase();
  
  // Only initialize Redis-dependent features if worker or reconciliation is enabled
  if (env.ENABLE_EMBEDDED_PAYMENT_WORKER || env.ENABLE_RECONCILIATION_JOB) {
    initializePaymentQueueEvents();
  }

  if (env.ENABLE_EMBEDDED_PAYMENT_WORKER) {
    startPaymentWebhookWorker();
    // Start auto-recovery system only if worker is enabled
    startAutoRecovery();
  }

  if (env.ENABLE_RECONCILIATION_JOB) {
    startReconciliationScheduler();
  }

  // Start pool monitoring in production (logs every 2 minutes)
  if (env.NODE_ENV === "production") {
    startPoolMonitoring(120000, false); // 2 minutes, non-verbose
  } else {
  // In development, log every minute with verbose output
    startPoolMonitoring(60000, true);
  }

  const port = env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  // Graceful shutdown on SIGTERM and SIGINT
  const shutdown = async (signal) => {
    console.log(`\n📢 ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log("🛑 HTTP server closed");
      if (env.ENABLE_EMBEDDED_PAYMENT_WORKER) {
        await stopAutoRecovery();
        await stopPaymentWebhookWorker();
      }
      if (env.ENABLE_RECONCILIATION_JOB) {
        await stopReconciliationScheduler();
      }
      if (env.ENABLE_EMBEDDED_PAYMENT_WORKER || env.ENABLE_RECONCILIATION_JOB) {
        await closePaymentQueues();
        await closeRedisConnection();
      }
      await closeDatabase();
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("❌ Forced shutdown - timeout reached");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
