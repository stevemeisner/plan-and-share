import { useState } from "react";

interface CommentComposerProps {
  onSubmit: (body: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export function CommentComposer({ onSubmit, onCancel, placeholder }: CommentComposerProps) {
  const [body, setBody] = useState("");

  return (
    <div className="bg-[var(--plan-comment-bg)] border border-[var(--plan-border)] rounded-lg p-3 mt-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && body.trim()) {
            e.preventDefault();
            onSubmit(body.trim());
            setBody("");
          }
        }}
        placeholder={placeholder ?? "Leave a comment..."}
        className="w-full bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md p-2 text-sm text-[var(--plan-text-primary)] resize-none focus:outline-none focus:border-[var(--plan-accent)]"
        rows={3}
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-primary)]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (body.trim()) {
              onSubmit(body.trim());
              setBody("");
            }
          }}
          disabled={!body.trim()}
          className="px-3 py-1 text-xs bg-[var(--plan-accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
        >
          Comment
        </button>
      </div>
    </div>
  );
}
