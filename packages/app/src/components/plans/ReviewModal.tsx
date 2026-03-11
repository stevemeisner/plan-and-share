import { useState } from "react";

interface ReviewModalProps {
  action: "approved" | "changes_requested";
  onSubmit: (note: string) => void;
  onClose: () => void;
}

export function ReviewModal({ action, onSubmit, onClose }: ReviewModalProps) {
  const [note, setNote] = useState("");
  const isApproval = action === "approved";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--plan-text-heading)] mb-2">
          {isApproval ? "Approve Plan" : "Request Changes"}
        </h3>
        <p className="text-sm text-[var(--plan-text-secondary)] mb-4">
          {isApproval
            ? "Confirm this plan is ready for implementation."
            : "Describe what needs to change before this can be approved."}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isApproval ? "Optional note..." : "What needs to change?"}
          className="w-full bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-md p-3 text-sm text-[var(--plan-text-primary)] resize-none focus:outline-none focus:border-[var(--plan-accent)]"
          rows={3}
          autoFocus={!isApproval}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(note)}
            className={`px-4 py-2 text-sm text-white rounded-md ${
              isApproval
                ? "bg-[var(--plan-success)] hover:opacity-90"
                : "bg-[var(--plan-danger)] hover:opacity-90"
            }`}
          >
            {isApproval ? "Approve" : "Request Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
