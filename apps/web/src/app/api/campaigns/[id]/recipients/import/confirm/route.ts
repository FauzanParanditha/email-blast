import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@email-blast/db";
import { isValidEmail } from "@/lib/validateEmail";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Recipients can only be imported into a draft campaign" },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const rows: unknown[] = Array.isArray(body.rows) ? body.rows : [];

  const validRows = rows.filter(
    (row): row is { email: string; name: string | null } =>
      typeof row === "object" &&
      row !== null &&
      typeof (row as { email?: unknown }).email === "string" &&
      isValidEmail((row as { email: string }).email),
  );

  if (validRows.length === 0) {
    return NextResponse.json({ error: "No valid rows to import" }, { status: 400 });
  }

  const result = await prisma.recipient.createMany({
    data: validRows.map((row) => ({
      campaignId: params.id,
      email: row.email.trim(),
      name: row.name?.trim() || null,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ insertedCount: result.count });
}
