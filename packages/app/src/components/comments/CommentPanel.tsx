import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { CommentThread } from "./CommentThread";
import { CommentComposer } from "./CommentComposer";

interface CommentPanelProps {
  planId: string;
  versionId: string;
  paragraphId: string;
  comments: Array<{
    _id: string;
    paragraphId: string;
    body: string;
    authorId: string;
    resolved: boolean;
    createdAt: number;
  }>;
  onClose: () => void;
}

export function CommentPanel({
  planId,
  versionId,
  paragraphId,
  comments,
  onClose,
}: CommentPanelProps) {
  const createComment = useMutation(api.comments.create);
  const paraComments = comments.filter((c) => c.paragraphId === paragraphId);

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--plan-border-subtle)]">
        <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider">
          Comments
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--plan-bg-hover)] text-[var(--plan-text-muted)] hover:text-[var(--plan-text-primary)] transition-colors"
          aria-label="Close comments"
        >
          ✕
        </button>
      </div>

      {/* Threads */}
      <div className="flex-1 overflow-y-auto p-4">
        {paraComments.length === 0 && (
          <div className="text-xs text-[var(--plan-text-muted)] italic">
            No comments yet on this paragraph.
          </div>
        )}
        {paraComments.map((comment) => (
          <CommentThread key={comment._id} comment={comment} />
        ))}
      </div>

      {/* Composer always visible */}
      <div className="p-4 border-t border-[var(--plan-border-subtle)]">
        <CommentComposer
          autoFocus={false}
          onSubmit={async (body) => {
            await createComment({
              planId: planId as any,
              versionId: versionId as any,
              paragraphId,
              body,
            });
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
