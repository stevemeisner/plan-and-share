import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { CommentComposer } from "./CommentComposer";
import { CommentThread } from "./CommentThread";

interface CommentAnchorProps {
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
  children: React.ReactNode;
}

export function CommentAnchor({
  planId,
  versionId,
  paragraphId,
  comments,
  children,
}: CommentAnchorProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const createComment = useMutation(api.comments.create);

  const paraComments = comments.filter((c) => c.paragraphId === paragraphId);
  const hasComments = paraComments.length > 0;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(isHovered || hasComments) && (
        <button
          onClick={() => setShowComposer(true)}
          className={`absolute -right-10 top-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-opacity ${
            hasComments
              ? "bg-[var(--plan-accent)] text-white opacity-80"
              : "bg-[var(--plan-bg-tertiary)] text-[var(--plan-text-muted)] opacity-0 group-hover:opacity-80"
          }`}
        >
          {hasComments ? paraComments.length : "+"}
        </button>
      )}

      <div
        className={
          hasComments || showComposer
            ? "bg-[var(--plan-comment-highlight)] -mx-4 px-4 py-1 rounded"
            : ""
        }
      >
        {children}
      </div>

      {paraComments.map((comment) => (
        <CommentThread key={comment._id} comment={comment} />
      ))}

      {showComposer && (
        <CommentComposer
          onSubmit={async (body) => {
            await createComment({ planId: planId as any, versionId: versionId as any, paragraphId, body });
            setShowComposer(false);
          }}
          onCancel={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}
