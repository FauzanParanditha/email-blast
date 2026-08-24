import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@email-blast/db";
import { sanitizeCampaignBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft campaigns can be edited" },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const data: { subject?: string; bodyHtml?: string } = {};

  if (typeof body.subject === "string" && body.subject.trim()) {
    data.subject = body.subject.trim();
  }

  if (typeof body.bodyHtml === "string") {
    data.bodyHtml = sanitizeCampaignBody(body.bodyHtml);
  }

  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ campaign: updated });
}
