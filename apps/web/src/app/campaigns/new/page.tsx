"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/Editor";

export default function NewCampaignPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    setError(null);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, bodyHtml }),
    });
    const data = await res.json();

    setCreating(false);

    if (!res.ok) {
      setError(data.error || "Failed to create campaign");
      return;
    }

    router.push(`/campaigns/${data.campaign.id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">New Campaign</h1>

      <div>
        <label className="mb-1 block text-sm font-medium">Subject</label>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="Campaign subject"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Body</label>
        <Editor value={bodyHtml} onChange={setBodyHtml} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleCreate}
        disabled={creating || !subject.trim()}
        className="rounded bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {creating ? "Creating..." : "Create Draft"}
      </button>
    </div>
  );
}
