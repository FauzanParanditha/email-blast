import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@email-blast/db";
import type { CampaignAttachment } from "@email-blast/queue";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "attachments");
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function getAttachments(campaign: { attachments: unknown }): CampaignAttachment[] {
  return Array.isArray(campaign.attachments) ? (campaign.attachments as CampaignAttachment[]) : [];
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Attachments can only be added to a draft campaign" },
      { status: 409 },
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File must be smaller than 10MB" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  const attachment: CampaignAttachment = {
    url: `/uploads/attachments/${storedName}`,
    filename: file.name,
  };

  const attachments = [...getAttachments(campaign), attachment];

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { attachments: attachments as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ attachments });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Attachments can only be removed from a draft campaign" },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url : null;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const current = getAttachments(campaign);
  const attachments = current.filter((a) => a.url !== url);

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { attachments: attachments as unknown as Prisma.InputJsonValue },
  });

  const filename = path.basename(url);
  await unlink(path.join(UPLOAD_DIR, filename)).catch(() => {});

  return NextResponse.json({ attachments });
}
