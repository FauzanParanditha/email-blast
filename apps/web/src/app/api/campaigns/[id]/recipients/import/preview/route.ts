import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@email-blast/db";
import { parseRecipientFile } from "@/lib/parseFile";
import { isValidEmail } from "@/lib/validateEmail";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rawRows;
  try {
    rawRows = await parseRecipientFile(buffer, file.name);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse file" },
      { status: 400 },
    );
  }

  const existingRecipients = await prisma.recipient.findMany({
    where: { campaignId: params.id },
    select: { email: true },
  });
  const existingEmails = new Set(existingRecipients.map((r) => r.email.toLowerCase()));

  const validRows: { email: string; name: string | null }[] = [];
  const invalidRows: { row: number; email: string; reason: string }[] = [];
  const alreadyImportedRows: { row: number; email: string }[] = [];
  const seenEmails = new Set<string>();

  for (const raw of rawRows) {
    const email = raw.email.toLowerCase();

    if (!raw.email) {
      invalidRows.push({ row: raw.row, email: raw.email, reason: "Email is empty" });
      continue;
    }

    if (!isValidEmail(raw.email)) {
      invalidRows.push({ row: raw.row, email: raw.email, reason: "Invalid email format" });
      continue;
    }

    if (seenEmails.has(email)) {
      invalidRows.push({ row: raw.row, email: raw.email, reason: "Duplicate email in file" });
      continue;
    }

    if (existingEmails.has(email)) {
      alreadyImportedRows.push({ row: raw.row, email: raw.email });
      seenEmails.add(email);
      continue;
    }

    seenEmails.add(email);
    validRows.push({ email: raw.email, name: raw.name });
  }

  return NextResponse.json({
    campaignId: params.id,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    alreadyImportedCount: alreadyImportedRows.length,
    validRows,
    invalidRows,
    alreadyImportedRows,
  });
}
