import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Worker, type Job } from "bullmq";
import { EMAIL_QUEUE_NAME, getRedisConnectionOptions, type EmailJobData } from "@email-blast/queue";
import { prisma } from "@email-blast/db";
import { sendCampaignEmail } from "./mailer";

const JOB_ATTEMPTS = Number(process.env.WORKER_JOB_ATTEMPTS || 3);

function personalize(bodyHtml: string, name: string | null) {
  return bodyHtml.replace(/\{\{\s*name\s*\}\}/gi, name?.trim() || "");
}

async function markCampaignSentIfDone(campaignId: string) {
  const pendingCount = await prisma.recipient.count({
    where: { campaignId, status: "PENDING" },
  });

  if (pendingCount === 0) {
    await prisma.campaign.updateMany({
      where: { id: campaignId, status: "SENDING" },
      data: { status: "SENT", sentAt: new Date() },
    });
  }
}

async function processor(job: Job<EmailJobData>) {
  const { recipientId, email, name, subject, bodyHtml } = job.data;

  await sendCampaignEmail({
    to: email,
    subject,
    html: personalize(bodyHtml, name),
  });

  await prisma.recipient.update({
    where: { id: recipientId },
    data: { status: "SENT", lastError: null, attemptCount: job.attemptsMade + 1 },
  });
}

const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processor, {
  connection: getRedisConnectionOptions(),
  concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  limiter: {
    max: Number(process.env.WORKER_RATE_LIMIT_MAX || 10),
    duration: Number(process.env.WORKER_RATE_LIMIT_DURATION_MS || 1000),
  },
});

worker.on("completed", async (job) => {
  await markCampaignSentIfDone(job.data.campaignId);
});

worker.on("failed", async (job, err) => {
  if (!job) return;

  const isFinalAttempt = job.attemptsMade >= JOB_ATTEMPTS;

  await prisma.recipient.update({
    where: { id: job.data.recipientId },
    data: {
      attemptCount: job.attemptsMade,
      lastError: err.message?.slice(0, 1000) ?? "Unknown error",
      status: isFinalAttempt ? "FAILED" : "PENDING",
    },
  });

  if (isFinalAttempt) {
    await markCampaignSentIfDone(job.data.campaignId);
  }
});

worker.on("error", (err) => {
  console.error("[worker] internal error", err);
});

console.log(
  `[worker] listening on queue "${EMAIL_QUEUE_NAME}" (concurrency=${worker.opts.concurrency})`,
);
