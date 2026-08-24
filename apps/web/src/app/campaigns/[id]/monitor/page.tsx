import { notFound } from "next/navigation";
import { prisma } from "@email-blast/db";
import { CampaignMonitor } from "@/components/CampaignMonitor";

export default async function MonitorPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    notFound();
  }

  return <CampaignMonitor campaignId={campaign.id} />;
}
