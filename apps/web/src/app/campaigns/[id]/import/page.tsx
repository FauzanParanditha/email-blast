import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@email-blast/db";
import { ImportUploader } from "@/components/ImportUploader";

export default async function ImportPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Import Recipients</h1>
        <Link href={`/campaigns/${campaign.id}`} className="text-sm text-blue-600 hover:underline">
          Back to campaign
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        Upload a CSV or Excel file with <code>email</code> and <code>name</code> columns. Only
        rows with a valid, non-duplicate email will be importable.
      </p>

      <ImportUploader campaignId={campaign.id} />
    </div>
  );
}
