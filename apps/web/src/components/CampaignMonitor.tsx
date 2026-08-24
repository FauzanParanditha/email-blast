"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { RecipientTable } from "./RecipientTable";

type Report = {
  campaign: { subject: string; status: string };
  total: number;
  sent: number;
  failed: number;
  pending: number;
};

type Recipient = {
  id: string;
  email: string;
  name: string | null;
  status: "PENDING" | "SENT" | "FAILED";
  attemptCount: number;
  lastError: string | null;
  updatedAt: string;
};

const POLL_INTERVAL_MS = 4000;

export function CampaignMonitor({ campaignId }: { campaignId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/campaigns/${campaignId}/report`, { cache: "no-store" });
      if (!cancelled && res.ok) {
        setReport(await res.json());
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipients() {
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const res = await fetch(`/api/campaigns/${campaignId}/recipients${query}`, {
        cache: "no-store",
      });
      if (!cancelled && res.ok) {
        const data = await res.json();
        setRecipients(data.recipients);
      }
    }

    loadRecipients();
    const interval = setInterval(loadRecipients, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [campaignId, statusFilter]);

  if (!report) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{report.campaign.subject}</h1>
        <p className="text-sm text-slate-500">Status: {report.campaign.status}</p>
      </div>

      <ProgressBar
        total={report.total}
        sent={report.sent}
        failed={report.failed}
        pending={report.pending}
      />

      <RecipientTable
        recipients={recipients}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </div>
  );
}
