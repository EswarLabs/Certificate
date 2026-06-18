import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export const pdfQueue = new Queue(
    "pdfQueue",
    {
        connection: redis,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000,
            }
        }
    }
)