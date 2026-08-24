import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@email-blast/db";
import { sanitizeCampaignBody } from "@/lib/sanitize";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { recipients: true } },
    },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const bodyHtml = typeof body.bodyHtml === "string" ? body.bodyHtml : "";

  if (!subject) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      subject,
      bodyHtml: sanitizeCampaignBody(bodyHtml),
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
