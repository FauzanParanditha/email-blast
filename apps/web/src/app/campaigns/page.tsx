import Link from "next/link";
import { prisma } from "@email-blast/db";

export const dynamic = "force-dynamic";
export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="rounded bg-slate-800 px-4 py-2 text-sm text-white"
        >
          New Campaign
        </Link>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              <th className="p-3">Recipients</th>
              <th className="p-3">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-t">
                <td className="p-3">{campaign.subject || "(no subject)"}</td>
                <td className="p-3">{campaign.status}</td>
                <td className="p-3">{campaign._count.recipients}</td>
                <td className="p-3">{campaign.createdAt.toLocaleString()}</td>
                <td className="p-3">
                  <Link href={`/campaigns/${campaign.id}`} className="text-blue-600 hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
