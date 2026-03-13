import { useState } from "react";

interface CommentAnchorProps {
  paragraphId: string;
  comments: Array<{
    _id: string;
    paragraphId: string;
    body: string;
    authorId: string;
    resolved: boolean;
    createdAt: number;
  }>;
  onSelectParagraph: (id: string) => void;
  isActive: boolean;
  children: React.ReactNode;
}

export function CommentAnchor({
  paragraphId,
  comments,
  onSelectParagraph,
  isActive,
  children,
}: CommentAnchorProps) {
  const [isHovered, setIsHovered] = useState(false);

  const paraComments = comments.filter((c) => c.paragraphId === paragraphId);
  const hasComments = paraComments.length > 0;

  const bgClass =
    isActive || hasComments
      ? "bg-[var(--plan-comment-highlight)] -mx-4 px-4 py-1 rounded-lg"
      : isHovered
        ? "bg-[var(--plan-comment-hover)] -mx-4 px-4 py-1 rounded-lg transition-colors duration-150"
        : "transition-colors duration-150";

  return (
    <div
      className="relative pr-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => onSelectParagraph(paragraphId)}
        className={`absolute right-0 top-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-opacity ${
          hasComments
            ? "bg-[var(--plan-accent)] text-white opacity-80"
            : isHovered
              ? "bg-[var(--plan-bg-tertiary)] text-[var(--plan-text-muted)] opacity-80"
              : "opacity-0 pointer-events-none"
        }`}
      >
        {hasComments ? paraComments.length : "+"}
      </button>

      <div className={bgClass}>
        {children}
      </div>
    </div>
  );
}
