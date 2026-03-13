import type { Root, Element } from "hast";
import type { Plugin } from "unified";
import GithubSlugger from "github-slugger";

// Keys use github-slugger output for headings containing "&" (produces double hyphens)
const SECTION_TYPE_MAP: Record<string, string> = {
  "executive-summary": "summary",
  "background--context": "background",
  "background-context": "background",
  "goals--non-goals": "goals",
  "goals-non-goals": "goals",
  "technical-architecture": "technical",
  "implementation-approach": "implementation",
  "test-coverage-plan": "testing",
  "rollout--migration": "rollout",
  "rollout-migration": "rollout",
  "open-questions": "questions",
  "risks--mitigations": "risks",
  "risks-mitigations": "risks",
};

export const semanticClasses: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    const children = tree.children as Element[];
    const newChildren: Element[] = [];
    let currentSection: Element | null = null;

    for (const node of children) {
      if (node.type === "element" && node.tagName === "h2") {
        if (currentSection) {
          newChildren.push(currentSection);
        }

        const text = getTextContent(node);
        const currentSlug = slugger.slug(text);
        const sectionType = SECTION_TYPE_MAP[currentSlug] || currentSlug;

        node.properties = node.properties || {};
        node.properties.className = ["plan-heading"];

        currentSection = {
          type: "element",
          tagName: "section",
          properties: {
            className: ["plan-section", `plan-section--${sectionType}`],
            id: currentSlug,
          },
          children: [node],
        };
      } else if (currentSection) {
        addElementClasses(node);
        currentSection.children.push(node);
      } else {
        if (node.type === "element" && node.tagName === "h1") {
          node.properties = node.properties || {};
          node.properties.className = ["plan-title"];
        }
        addElementClasses(node);
        newChildren.push(node);
      }
    }

    if (currentSection) {
      newChildren.push(currentSection);
    }

    tree.children = newChildren;
  };
};

const TAG_CLASS_MAP: Record<string, string> = {
  table: "plan-table",
  ul: "plan-list",
  ol: "plan-list",
  pre: "plan-code",
  p: "plan-paragraph",
  blockquote: "plan-blockquote",
};

function addElementClasses(node: Element | { type: string }): void {
  if (node.type !== "element") return;
  const el = node as Element;
  const cls = TAG_CLASS_MAP[el.tagName];
  if (cls) {
    el.properties = el.properties || {};
    el.properties.className = el.properties.className
      ? [...(el.properties.className as string[]), cls]
      : [cls];
  }
}

function getTextContent(node: Element): string {
  let text = "";
  for (const child of node.children) {
    if (child.type === "text") {
      text += child.value;
    } else if (child.type === "element") {
      text += getTextContent(child);
    }
  }
  return text;
}
