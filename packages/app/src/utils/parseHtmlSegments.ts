export type Segment =
  | { type: "html"; html: string; key: string }
  | { type: "commentable"; html: string; paragraphId: string };

export type ContentSection = {
  id: string;
  className: string;
  headingHtml: string;
  segments: Segment[];
};

export type ParseResult = {
  preamble: string;
  sections: ContentSection[];
};

export function parseHtmlSegments(htmlContent: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const body = doc.body;

  let preamble = "";
  const sections: ContentSection[] = [];

  for (const node of Array.from(body.children)) {
    // Top-level h1 goes into preamble (hidden by CSS anyway)
    if (node.tagName === "H1") {
      preamble += (node as HTMLElement).outerHTML;
      continue;
    }

    if (node.tagName === "SECTION") {
      const section = node as HTMLElement;
      const id = section.id || `section-${sections.length}`;
      const className = section.className || "";

      // Extract heading (first child h2/h3/h4/h5/h6)
      let headingHtml = "";
      const segments: Segment[] = [];
      let htmlBuffer = "";
      let segIdx = 0;

      for (const child of Array.from(section.children)) {
        const el = child as HTMLElement;

        // First heading in section → headingHtml
        if (!headingHtml && /^H[2-6]$/.test(el.tagName)) {
          headingHtml = el.outerHTML;
          continue;
        }

        const paragraphId = el.getAttribute("data-paragraph-id");
        if (paragraphId) {
          // Flush any buffered non-commentable HTML
          if (htmlBuffer) {
            segments.push({
              type: "html",
              html: htmlBuffer,
              key: `${id}-html-${segIdx++}`,
            });
            htmlBuffer = "";
          }
          segments.push({
            type: "commentable",
            html: el.outerHTML,
            paragraphId,
          });
        } else {
          htmlBuffer += el.outerHTML;
        }
      }

      // Flush remaining buffer
      if (htmlBuffer) {
        segments.push({
          type: "html",
          html: htmlBuffer,
          key: `${id}-html-${segIdx}`,
        });
      }

      sections.push({ id, className, headingHtml, segments });
    } else {
      // Non-section top-level elements (rare) → treat as preamble
      preamble += (node as HTMLElement).outerHTML;
    }
  }

  return { preamble, sections };
}
