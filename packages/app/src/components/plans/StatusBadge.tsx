const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[var(--plan-bg-tertiary)] text-[var(--plan-text-muted)]",
  in_review: "bg-blue-500/15 text-[var(--plan-accent)]",
  approved: "bg-green-500/15 text-[var(--plan-success)]",
  rejected: "bg-red-500/15 text-[var(--plan-danger)]",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Changes Requested",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? ""}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
