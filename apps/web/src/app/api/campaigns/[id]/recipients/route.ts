import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@email-blast/db";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  const where = {
    campaignId: params.id,
    ...(status && ["PENDING", "SENT", "FAILED"].includes(status)
      ? { status: status as "PENDING" | "SENT" | "FAILED" }
      : {}),
  };

  const [recipients, total] = await Promise.all([
    prisma.recipient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.recipient.count({ where }),
  ]);

  return NextResponse.json({
    recipients,
    total,
    page,
    pageSize: PAGE_SIZE,
  });
}
