import { notFound } from "next/navigation";
import { prisma } from "@email-blast/db";
import { CampaignDetail } from "@/components/CampaignDetail";

export const dynamic = "force-dynamic";
export default async function CampaignPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    notFound();
  }

  const recipientCount = await prisma.recipient.count({
    where: { campaignId: campaign.id },
  });

  const attachments = Array.isArray(campaign.attachments)
    ? (campaign.attachments as unknown as { url: string; filename: string }[])
    : [];

  return (
    <CampaignDetail
      campaign={{ ...campaign, attachments }}
      recipientCount={recipientCount}
    />
  );
}
