export interface RenderedPlan {
  html: string;
  paragraphIds: string[];
}

export function renderMarkdown(_markdown: string): RenderedPlan {
  return { html: "", paragraphIds: [] };
}
