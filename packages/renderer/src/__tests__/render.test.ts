import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../index";

describe("renderMarkdown", () => {
  it("renders a heading and paragraph to HTML", async () => {
    const md = "## Hello World\n\nThis is a paragraph.";
    const { html } = await renderMarkdown(md);

    expect(html).toContain('<h2 class="plan-heading"');
    expect(html).toContain("Hello World");
    expect(html).toContain('class="plan-paragraph"');
    expect(html).toContain("This is a paragraph.");
  });

  it("generates stable paragraph IDs based on heading sections", async () => {
    const md = `## Executive Summary

First paragraph.

Second paragraph.

## Technical Architecture

Architecture details.
`;
    const { paragraphIds } = await renderMarkdown(md);

    expect(paragraphIds).toContain("executive-summary-p1");
    expect(paragraphIds).toContain("executive-summary-p2");
    expect(paragraphIds).toContain("technical-architecture-p1");
  });

  it("adds data-paragraph-id attributes to HTML elements", async () => {
    const md = `## Goals

Be awesome.
`;
    const { html } = await renderMarkdown(md);

    expect(html).toContain('data-paragraph-id="goals-p1"');
  });

  it("handles code blocks and lists with unique IDs", async () => {
    const md = `## Implementation

Some text.

\`\`\`typescript
const x = 1;
\`\`\`

- Item one
- Item two
`;
    const { paragraphIds } = await renderMarkdown(md);

    expect(paragraphIds).toContain("implementation-p1");
    expect(paragraphIds).toContain("implementation-code1");
    expect(paragraphIds).toContain("implementation-list1");
  });

  it("handles empty markdown", async () => {
    const { html, paragraphIds } = await renderMarkdown("");
    expect(html).toContain('class="plan-content"');
    expect(paragraphIds).toEqual([]);
  });

  it("handles markdown with no h2 sections", async () => {
    const md = "# Title\n\nJust a paragraph with no sections.";
    const { html, paragraphIds } = await renderMarkdown(md);
    expect(html).toContain("Just a paragraph");
    expect(paragraphIds).toEqual([]);
  });
});
