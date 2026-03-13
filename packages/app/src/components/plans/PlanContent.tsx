import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { CommentThread } from "../comments/CommentThread";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    darkMode: true,
    background: "transparent",
  },
});

interface PlanContentProps {
  htmlContent: string;
  planId?: string;
  versionId?: string;
}

export function PlanContent({ htmlContent, planId, versionId }: PlanContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const comments = useQuery(
    api.comments.listByVersion,
    versionId ? { versionId: versionId as any } : "skip"
  ) ?? [];

  useEffect(() => {
    if (!contentRef.current) return;

    const codeBlocks = contentRef.current.querySelectorAll("code.language-mermaid");
    if (codeBlocks.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const code of codeBlocks) {
        if (cancelled) return;
        const pre = code.parentElement;
        if (!pre || pre.tagName !== "PRE") continue;

        const diagram = code.textContent || "";
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

        try {
          const { svg } = await mermaid.render(id, diagram);
          if (cancelled) return;
          const wrapper = document.createElement("div");
          wrapper.className = "mermaid-diagram";
          wrapper.innerHTML = svg;
          pre.replaceWith(wrapper);
        } catch {
          // Leave the code block as-is if mermaid can't parse it
        }
      }
    })();

    return () => { cancelled = true; };
  }, [htmlContent]);

  return (
    <div className="relative">
      <article
        ref={contentRef}
        className="plan-content prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
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
