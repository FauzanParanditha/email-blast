import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@email-blast/db";
import { emailQueue, JOB_ATTEMPTS, JOB_BACKOFF_DELAY_MS } from "@/lib/queue";
import { sanitizeCampaignBody } from "@/lib/sanitize";
import type { CampaignAttachment, EmailJobData } from "@email-blast/queue";

export const dynamic = "force-dynamic";
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft campaigns can be sent" },
      { status: 409 },
    );
  }

  const pendingRecipients = await prisma.recipient.findMany({
    where: { campaignId: campaign.id, status: "PENDING" },
    select: { id: true, email: true, name: true },
  });

  if (pendingRecipients.length === 0) {
    return NextResponse.json(
      { error: "This campaign has no recipients to send to" },
      { status: 400 },
    );
  }

  const bodyHtml = sanitizeCampaignBody(campaign.bodyHtml);
  const attachments = Array.isArray(campaign.attachments)
    ? (campaign.attachments as unknown as CampaignAttachment[])
    : [];

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "SENDING", bodyHtml },
  });

  await emailQueue.addBulk(
    pendingRecipients.map((recipient) => ({
      name: "send-email",
      data: {
        recipientId: recipient.id,
        campaignId: campaign.id,
        email: recipient.email,
        name: recipient.name,
        subject: campaign.subject,
        bodyHtml,
        attachments,
      } satisfies EmailJobData,
      opts: {
        jobId: `campaign-${campaign.id}-recipient-${recipient.id}`,
        attempts: JOB_ATTEMPTS,
        backoff: { type: "exponential", delay: JOB_BACKOFF_DELAY_MS },
        removeOnComplete: 1000,
        removeOnFail: false,
      },
    })),
  );

  return NextResponse.json({ enqueued: pendingRecipients.length });
}
