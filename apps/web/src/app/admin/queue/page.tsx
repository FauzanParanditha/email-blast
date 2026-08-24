"use client";

import { useEffect, useState } from "react";

type QueueStats = {
  counts: Record<string, number>;
  recentFailedJobs: {
    id: string;
    email: string;
    campaignId: string;
    attemptsMade: number;
    failedReason: string | null;
  }[];
};

const POLL_INTERVAL_MS = 4000;

export default function AdminQueuePage() {
  const [stats, setStats] = useState<QueueStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const res = await fetch("/api/admin/queue", { cache: "no-store" });
      if (!cancelled && res.ok) {
        setStats(await res.json());
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!stats) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Queue Admin</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(stats.counts).map(([key, value]) => (
          <div key={key} className="rounded border bg-white p-4 text-center">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-xs uppercase text-slate-500">{key}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-2 font-medium">Recent failed jobs</h2>
        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2">Job ID</th>
                <th className="p-2">Email</th>
                <th className="p-2">Attempts</th>
                <th className="p-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentFailedJobs.map((job) => (
                <tr key={job.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{job.id}</td>
                  <td className="p-2">{job.email}</td>
                  <td className="p-2">{job.attemptsMade}</td>
                  <td className="p-2 text-red-600">{job.failedReason ?? "-"}</td>
                </tr>
              ))}
              {stats.recentFailedJobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    No failed jobs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
