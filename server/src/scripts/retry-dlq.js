import { closeRedisConnection } from "../config/redis.js";
import { retryDlqJob } from "../queue/paymentWebhook.queue.js";
import { logStructured } from "../utils/observability.js";

async function main() {
  const dlqJobId = process.argv[2];
  if (!dlqJobId) {
    console.error("Usage: npm run retry:dlq -- <dlqJobId>");
    process.exit(1);
  }

  await retryDlqJob(dlqJobId);
  logStructured("info", "dlq_job_retried", { dlqJobId });
  await closeRedisConnection();
  process.exit(0);
}

main().catch(async (error) => {
  logStructured("error", "dlq_retry_failed", {
    message: error?.message || "Unknown DLQ retry error",
  });
  await closeRedisConnection();
  process.exit(1);
});
