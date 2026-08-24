import { NextResponse } from "next/server";
import { emailQueue } from "@/lib/queue";

export async function GET() {
  const counts = await emailQueue.getJobCounts(
    "waiting",
    "active",
    "delayed",
    "completed",
    "failed",
    "paused",
  );

  const failedJobs = await emailQueue.getJobs(["failed"], 0, 19);

  return NextResponse.json({
    counts,
    recentFailedJobs: failedJobs.map((job) => ({
      id: job.id,
      email: job.data.email,
      campaignId: job.data.campaignId,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    })),
  });
}
