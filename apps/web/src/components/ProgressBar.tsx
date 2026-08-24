export function ProgressBar({
  total,
  sent,
  failed,
  pending,
}: {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}) {
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded bg-slate-200">
        <div className="bg-green-500" style={{ width: `${pct(sent)}%` }} />
        <div className="bg-red-500" style={{ width: `${pct(failed)}%` }} />
        <div className="bg-slate-400" style={{ width: `${pct(pending)}%` }} />
      </div>
      <div className="mt-2 flex gap-4 text-sm text-slate-600">
        <span>Sent: {sent}</span>
        <span>Failed: {failed}</span>
        <span>Pending: {pending}</span>
        <span>Total: {total}</span>
      </div>
    </div>
  );
}
