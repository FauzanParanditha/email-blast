"use client";

import { useRef, useState } from "react";

type Attachment = { url: string; filename: string };

export function AttachmentUploader({
  campaignId,
  initialAttachments,
  disabled,
}: {
  campaignId: string;
  initialAttachments: Attachment[];
  disabled?: boolean;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/campaigns/${campaignId}/attachments`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      setError(data.error || "Failed to upload attachment");
      return;
    }

    setAttachments(data.attachments);
  }

  async function handleRemove(url: string) {
    setError(null);

    const res = await fetch(`/api/campaigns/${campaignId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to remove attachment");
      return;
    }

    setAttachments(data.attachments);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Attachments</label>

      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((attachment) => (
            <li
              key={attachment.url}
              className="flex items-center justify-between rounded border px-3 py-1.5 text-sm"
            >
              <a href={attachment.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                {attachment.filename}
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(attachment.url)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleUpload(file);
              event.target.value = "";
            }}
            className="text-sm"
          />
          {uploading && <span className="text-xs text-slate-500">Uploading...</span>}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
