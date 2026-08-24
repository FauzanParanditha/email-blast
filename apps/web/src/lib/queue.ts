import { Queue } from "bullmq";
import { EMAIL_QUEUE_NAME, getRedisConnectionOptions, type EmailJobData } from "@email-blast/queue";

declare global {
  // eslint-disable-next-line no-var
  var __emailQueue: Queue<EmailJobData> | undefined;
}

export const emailQueue =
  global.__emailQueue ??
  new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: getRedisConnectionOptions(),
  });

if (process.env.NODE_ENV !== "production") {
  global.__emailQueue = emailQueue;
}

export const JOB_ATTEMPTS = Number(process.env.WORKER_JOB_ATTEMPTS || 3);
export const JOB_BACKOFF_DELAY_MS = Number(process.env.WORKER_BACKOFF_DELAY_MS || 5000);
