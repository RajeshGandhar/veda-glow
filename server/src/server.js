import app from "./app.js";
import { connectDatabase, closeDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSentry } from "./utils/sentry.js";
import { startPoolMonitoring } from "./utils/db-monitor.js";

// Initialize Sentry first
initializeSentry();

async function startServer() {
  await connectDatabase();

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
