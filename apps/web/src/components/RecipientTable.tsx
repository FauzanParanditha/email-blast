type Recipient = {
  id: string;
  email: string;
  name: string | null;
  status: "PENDING" | "SENT" | "FAILED";
  attemptCount: number;
  lastError: string | null;
  updatedAt: string;
};

const STATUS_OPTIONS = ["ALL", "PENDING", "SENT", "FAILED"] as const;

export function RecipientTable({
  recipients,
  statusFilter,
  onStatusFilterChange,
}: {
  recipients: Recipient[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusFilterChange(status)}
            className={`rounded px-3 py-1 text-sm ${
              statusFilter === status
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            } border`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2">Email</th>
              <th className="p-2">Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Attempts</th>
              <th className="p-2">Last error</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient) => (
              <tr key={recipient.id} className="border-t">
                <td className="p-2">{recipient.email}</td>
                <td className="p-2">{recipient.name ?? "-"}</td>
                <td className="p-2">
                  <StatusBadge status={recipient.status} />
                </td>
                <td className="p-2">{recipient.attemptCount}</td>
                <td className="p-2 text-red-600">{recipient.lastError ?? "-"}</td>
              </tr>
            ))}
            {recipients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  No recipients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Recipient["status"] }) {
  const colors: Record<Recipient["status"], string> = {
    SENT: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    PENDING: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status]}`}>{status}</span>
  );
}
