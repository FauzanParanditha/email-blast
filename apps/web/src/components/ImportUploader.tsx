"use client";

import { useState } from "react";

type InvalidRow = { row: number; email: string; reason: string };
type ValidRow = { email: string; name: string | null };

type PreviewResult = {
  validCount: number;
  invalidCount: number;
  validRows: ValidRow[];
  invalidRows: InvalidRow[];
};

export function ImportUploader({ campaignId }: { campaignId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertedCount, setInsertedCount] = useState<number | null>(null);

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setInsertedCount(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/campaigns/${campaignId}/recipients/import/preview`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to preview file");
      return;
    }

    setPreview(data);
  }

  async function handleConfirm() {
    if (!preview) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/campaigns/${campaignId}/recipients/import/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview.validRows }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to import recipients");
      return;
    }

    setInsertedCount(data.insertedCount);
    setPreview(null);
    setFile(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPreview(null);
            setInsertedCount(null);
            setError(null);
          }}
        />
        <button
          type="button"
          disabled={!file || loading}
          onClick={handlePreview}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          Preview
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {insertedCount !== null && (
        <p className="text-sm text-green-700">
          Imported {insertedCount} recipient(s) successfully.
        </p>
      )}

      {preview && (
        <div className="space-y-3 rounded border p-4">
          <div className="flex gap-6 text-sm">
            <span className="text-green-700">Valid rows: {preview.validCount}</span>
            <span className="text-red-700">Invalid rows: {preview.invalidCount}</span>
          </div>

          {preview.invalidRows.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.invalidRows.map((row) => (
                    <tr key={`${row.row}-${row.email}`} className="border-t">
                      <td className="p-2">{row.row}</td>
                      <td className="p-2">{row.email || "(empty)"}</td>
                      <td className="p-2">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            disabled={preview.validCount === 0 || loading}
            onClick={handleConfirm}
            className="rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Confirm Import ({preview.validCount} recipients)
          </button>
        </div>
      )}
    </div>
  );
}
