import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { CommentThread } from "../comments/CommentThread";

interface PlanContentProps {
  htmlContent: string;
  planId?: string;
  versionId?: string;
}

export function PlanContent({ htmlContent, planId, versionId }: PlanContentProps) {
  const comments = useQuery(
    api.comments.listByVersion,
    versionId ? { versionId: versionId as any } : "skip"
  ) ?? [];

  return (
    <div className="relative">
      <article
        className="plan-content prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {/* Comment overlays will be implemented with DOM observation in a future iteration */}
      {comments.length > 0 && (
        <div className="mt-8 border-t border-[var(--plan-border-subtle)] pt-4">
          <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-3">
            Comments ({comments.length})
          </div>
          {comments.map((comment: any) => (
            <div key={comment._id} className="mb-3">
              <div className="text-xs text-[var(--plan-accent)]">{comment.paragraphId}</div>
              <CommentThread comment={comment} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
