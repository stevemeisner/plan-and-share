import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { CommentComposer } from "./CommentComposer";

interface CommentThreadProps {
  comment: {
    _id: string;
    body: string;
    authorId: string;
    resolved: boolean;
    createdAt: number;
  };
}

export function CommentThread({ comment }: CommentThreadProps) {
  const [showReply, setShowReply] = useState(false);
  const replies = useQuery(api.comments.listReplies, { commentId: comment._id as any });
  const replyMutation = useMutation(api.comments.reply);
  const resolveMutation = useMutation(api.comments.resolve);

  return (
    <div
      className={`border-l-2 pl-4 my-3 ${
        comment.resolved
          ? "border-[var(--plan-border-subtle)] opacity-60"
          : "border-[var(--plan-comment-border)]"
      }`}
    >
      <div className="text-sm text-[var(--plan-text-primary)]">{comment.body}</div>
      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--plan-text-muted)]">
        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
        <button
          onClick={() => setShowReply(!showReply)}
          className="hover:text-[var(--plan-accent)]"
        >
          Reply
        </button>
        <button
          onClick={() =>
            resolveMutation({
              commentId: comment._id as any,
              resolved: !comment.resolved,
            })
          }
          className="hover:text-[var(--plan-accent)]"
        >
          {comment.resolved ? "Unresolve" : "Resolve"}
        </button>
      </div>

      {replies?.map((reply: any) => (
        <div key={reply._id} className="ml-4 mt-2 pt-2 border-t border-[var(--plan-border-subtle)]">
          <div className="text-sm text-[var(--plan-text-primary)]">{reply.body}</div>
          <div className="text-xs text-[var(--plan-text-muted)] mt-1">
            {new Date(reply.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}

      {showReply && (
        <CommentComposer
          placeholder="Reply..."
          onSubmit={async (body) => {
            await replyMutation({ commentId: comment._id as any, body });
            setShowReply(false);
          }}
          onCancel={() => setShowReply(false)}
        />
      )}
    </div>
  );
}
