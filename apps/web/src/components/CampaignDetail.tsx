"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Editor } from "./Editor";
import { AttachmentUploader } from "./AttachmentUploader";

type Campaign = {
  id: string;
  subject: string;
  bodyHtml: string;
  status: "DRAFT" | "SENDING" | "SENT";
  attachments: { url: string; filename: string }[];
};

export function CampaignDetail({
  campaign,
  recipientCount,
}: {
  campaign: Campaign;
  recipientCount: number;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(campaign.subject);
  const [bodyHtml, setBodyHtml] = useState(campaign.bodyHtml);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDraft = campaign.status === "DRAFT";

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, bodyHtml }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to save campaign");
      return;
    }

    setMessage("Saved.");
  }

  async function handleSend() {
    if (!confirm(`Send this campaign to ${recipientCount} recipient(s)?`)) return;

    setSending(true);
    setError(null);

    const res = await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
    const data = await res.json();

    setSending(false);

    if (!res.ok) {
      setError(data.error || "Failed to send campaign");
      return;
    }

    router.push(`/campaigns/${campaign.id}/monitor`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">
          {campaign.status}
        </span>
        <div className="flex gap-2 text-sm">
          <Link href={`/campaigns/${campaign.id}/import`} className="text-blue-600 hover:underline">
            Import recipients ({recipientCount})
          </Link>
          <Link href={`/campaigns/${campaign.id}/monitor`} className="text-blue-600 hover:underline">
            Monitoring
          </Link>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Subject</label>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          disabled={!isDraft}
          className="w-full rounded border px-3 py-2 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Body</label>
        {isDraft ? (
          <Editor value={bodyHtml} onChange={setBodyHtml} />
        ) : (
          <div
            className="rounded border p-3"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        )}
      </div>

      <AttachmentUploader
        campaignId={campaign.id}
        initialAttachments={campaign.attachments}
        disabled={!isDraft}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      {isDraft && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || recipientCount === 0}
            className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-40"
            title={recipientCount === 0 ? "Import recipients first" : undefined}
          >
            {sending ? "Sending..." : "Send Campaign"}
          </button>
        </div>
      )}
    </div>
  );
}
