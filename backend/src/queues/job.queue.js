import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export const jobQueue = new Queue("jobQueue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
