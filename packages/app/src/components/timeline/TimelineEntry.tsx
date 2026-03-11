interface TimelineEntryProps {
  type: "approved" | "changes_requested" | "version_pushed" | "created" | "review_requested";
  authorName: string;
  timestamp: number;
  note?: string;
  versionNumber?: number;
}

const TYPE_STYLES: Record<string, { dot: string; label: string }> = {
  approved: { dot: "bg-[var(--plan-success)]", label: "Approved" },
  changes_requested: { dot: "bg-[var(--plan-danger)]", label: "Requested changes" },
  version_pushed: { dot: "bg-[var(--plan-accent)]", label: "Pushed" },
  created: { dot: "bg-[var(--plan-text-muted)]", label: "Created plan" },
  review_requested: { dot: "bg-[var(--plan-accent)]", label: "Requested review" },
};

export function TimelineEntry({ type, authorName, timestamp, note, versionNumber }: TimelineEntryProps) {
  const style = TYPE_STYLES[type];

  return (
    <div className="relative pl-5 pb-4">
      <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${style.dot}`} />
      <div className="absolute left-[4.5px] top-4 bottom-0 w-px bg-[var(--plan-border-subtle)]" />

      <div className="text-sm">
        <span className="text-[var(--plan-text-heading)] font-medium">{authorName}</span>
        <span className="text-[var(--plan-text-muted)]">
          {" "}{style.label}
          {versionNumber ? ` v${versionNumber}` : ""}
        </span>
      </div>
      {note && (
        <p className="text-xs text-[var(--plan-text-muted)] mt-0.5 italic">"{note}"</p>
      )}
      <div className="text-xs text-[var(--plan-text-muted)] mt-0.5">
        {new Date(timestamp).toLocaleString()}
      </div>
    </div>
  );
}
