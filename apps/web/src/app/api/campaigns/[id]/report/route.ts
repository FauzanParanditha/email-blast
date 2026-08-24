import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@email-blast/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const counts = await prisma.recipient.groupBy({
    by: ["status"],
    where: { campaignId: params.id },
    _count: { _all: true },
  });

  const stats = { pending: 0, sent: 0, failed: 0 };
  for (const row of counts) {
    if (row.status === "PENDING") stats.pending = row._count._all;
    if (row.status === "SENT") stats.sent = row._count._all;
    if (row.status === "FAILED") stats.failed = row._count._all;
  }

  const total = stats.pending + stats.sent + stats.failed;

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      subject: campaign.subject,
      status: campaign.status,
      createdAt: campaign.createdAt,
      sentAt: campaign.sentAt,
    },
    total,
    ...stats,
  });
}
