import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

interface ReviewRequestModalProps {
  planId: string;
  currentUserId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewRequestModal({
  planId,
  currentUserId,
  onClose,
  onSubmitted,
}: ReviewRequestModalProps) {
  const users = useQuery(api.users.list, {}) as
    | Array<{ _id: string; name: string; avatarUrl?: string }>
    | undefined;
  const requestReview = useMutation(api.plans.requestReview);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const otherUsers = users?.filter((u) => u._id !== currentUserId) ?? [];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--plan-text-heading)] mb-2">
          Request Review
        </h3>
        <p className="text-sm text-[var(--plan-text-secondary)] mb-4">
          Select people to review this plan.
        </p>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {otherUsers.map((user) => (
            <label
              key={user._id}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--plan-bg-hover)] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(user._id)}
                onChange={() => toggle(user._id)}
                className="accent-[var(--plan-accent)]"
              />
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  className="w-6 h-6 rounded-full"
                  alt=""
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--plan-accent)] flex items-center justify-center text-white text-xs font-semibold">
                  {user.name?.[0] ?? "?"}
                </div>
              )}
              <span className="text-sm text-[var(--plan-text-primary)]">
                {user.name}
              </span>
            </label>
          ))}
          {otherUsers.length === 0 && (
            <p className="text-sm text-[var(--plan-text-muted)] px-3 py-2">
              No other users available.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (selected.size === 0) return;
              setBusy(true);
              await requestReview({
                planId: planId as any,
                reviewerIds: Array.from(selected) as any,
              });
              setBusy(false);
              onSubmitted();
            }}
            disabled={selected.size === 0 || busy}
            className="px-4 py-2 text-sm text-white rounded-md bg-[var(--plan-accent)] hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Requesting..." : "Request Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
