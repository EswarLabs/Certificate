import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { sendCredentialEmail } from "../modules/email/email.service.js";

export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { credentialId, userId } = job.data;
    console.log(`[Email Worker] Processing job ${job.id} for credential ${credentialId}`);
    
    try {
      const result = await sendCredentialEmail(credentialId, userId);
      return result;
    } catch (error) {
      console.error(`[Email Worker] Failed to send email for credential ${credentialId}:`, error);
      throw error;
    }
  },
  { connection: redis, concurrency: 15, drainDelay: 60000, stalledInterval: 300000 }
);

emailWorker.on("completed", (job) => {
  console.log(`[Email Worker] Job ${job.id} has completed successfully.`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Email Worker] Job ${job.id} has failed with error: ${err.message}`);
});
