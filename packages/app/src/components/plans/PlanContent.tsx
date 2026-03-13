import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { CommentAnchor } from "../comments/CommentAnchor";
import { parseHtmlSegments } from "../../utils/parseHtmlSegments";
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

  const parsed = useMemo(() => parseHtmlSegments(htmlContent), [htmlContent]);

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
      <article ref={contentRef} className="plan-content prose prose-sm max-w-none">
        {parsed.preamble && (
          <div dangerouslySetInnerHTML={{ __html: parsed.preamble }} />
        )}
        {parsed.sections.map((section) => (
          <section key={section.id} id={section.id} className={section.className}>
            {section.headingHtml && (
              <div dangerouslySetInnerHTML={{ __html: section.headingHtml }} />
            )}
            {section.segments.map((seg) =>
              seg.type === "commentable" && planId && versionId ? (
                <CommentAnchor
                  key={seg.paragraphId}
                  paragraphId={seg.paragraphId}
                  planId={planId}
                  versionId={versionId}
                  comments={comments as any}
                >
                  <div dangerouslySetInnerHTML={{ __html: seg.html }} />
                </CommentAnchor>
              ) : (
                <div
                  key={seg.type === "commentable" ? seg.paragraphId : seg.key}
                  dangerouslySetInnerHTML={{ __html: seg.html }}
                />
              )
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
