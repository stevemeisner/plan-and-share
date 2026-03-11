import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { paragraphIds } from "./plugins/paragraph-ids";
import { semanticClasses } from "./plugins/semantic-classes";

export interface RenderedPlan {
  html: string;
  paragraphIds: string[];
}

export async function renderMarkdown(markdown: string): Promise<{
  html: string;
  paragraphIds: string[];
}> {
  const collectedIds: string[] = [];

  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(semanticClasses)
    .use(paragraphIds, { onId: (id: string) => collectedIds.push(id) })
    .use(rehypeStringify)
    .process(markdown);

  const html = `<article class="plan-content">${String(result)}</article>`;

  return { html, paragraphIds: collectedIds };
}
