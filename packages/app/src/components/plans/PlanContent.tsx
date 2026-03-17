import { useEffect, useMemo, useRef, useState } from "react";
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

function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    mermaid.render(id, code).then(({ svg }) => setSvg(svg)).catch(() => {});
  }, [code]);

  if (!svg) {
    return <pre><code className="language-mermaid">{code}</code></pre>;
  }

  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface PlanContentProps {
  htmlContent: string;
  planId?: string;
  versionId?: string;
  comments?: Array<{
    _id: string;
    paragraphId: string;
    body: string;
    authorId: string;
    resolved: boolean;
    createdAt: number;
  }>;
  onSelectParagraph?: (id: string) => void;
  activeParagraphId?: string | null;
}

export function PlanContent({
  htmlContent,
  planId,
  versionId,
  comments = [],
  onSelectParagraph,
  activeParagraphId,
}: PlanContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseHtmlSegments(htmlContent), [htmlContent]);

  // Extract mermaid code from an HTML segment if it contains a mermaid code block
  const extractMermaid = (html: string): string | null => {
    const match = html.match(/<code class="language-mermaid">([\s\S]*?)<\/code>/);
    if (!match) return null;
    // Decode HTML entities
    const div = document.createElement("div");
    div.innerHTML = match[1];
    return div.textContent;
  };

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
            {section.segments.map((seg) => {
              const mermaidCode = extractMermaid(seg.html);
              const content = mermaidCode
                ? <MermaidDiagram code={mermaidCode} />
                : <div dangerouslySetInnerHTML={{ __html: seg.html }} />;

              return seg.type === "commentable" && planId && versionId && onSelectParagraph ? (
                <CommentAnchor
                  key={seg.paragraphId}
                  paragraphId={seg.paragraphId}
                  comments={comments as any}
                  onSelectParagraph={onSelectParagraph}
                  isActive={activeParagraphId === seg.paragraphId}
                >
                  {content}
                </CommentAnchor>
              ) : (
                <div key={seg.type === "commentable" ? seg.paragraphId : seg.key}>
                  {content}
                </div>
              );
            })}
          </section>
        ))}
      </article>
    </div>
  );
}
