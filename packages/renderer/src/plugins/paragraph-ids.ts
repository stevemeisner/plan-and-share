import type { Root, Element } from "hast";
import type { Plugin } from "unified";

interface ParagraphIdsOptions {
  onId: (id: string) => void;
}

export const paragraphIds: Plugin<[ParagraphIdsOptions], Root> = (options) => {
  return (tree: Root) => {
    const { onId } = options;

    visit(tree, (node, _sectionId) => {
      if (node.type !== "element") return;

      const el = node as Element;

      if (el.tagName === "section" && el.properties?.id) {
        const sid = String(el.properties.id);
        let pCount = 0;
        let codeCount = 0;
        let tableCount = 0;
        let listCount = 0;

        for (const child of el.children) {
          if ((child as Element).type !== "element") continue;
          const childEl = child as Element;

          if (childEl.tagName === "p") {
            pCount++;
            const paraId = `${sid}-p${pCount}`;
            wrapInCommentable(childEl, paraId);
            onId(paraId);
          } else if (childEl.tagName === "pre") {
            codeCount++;
            const paraId = `${sid}-code${codeCount}`;
            wrapInCommentable(childEl, paraId);
            onId(paraId);
          } else if (childEl.tagName === "table") {
            tableCount++;
            const paraId = `${sid}-table${tableCount}`;
            wrapInCommentable(childEl, paraId);
            onId(paraId);
          } else if (childEl.tagName === "ul" || childEl.tagName === "ol") {
            listCount++;
            const paraId = `${sid}-list${listCount}`;
            wrapInCommentable(childEl, paraId);
            onId(paraId);
          }
        }
      }
    });
  };
};

function wrapInCommentable(node: Element, paragraphId: string): void {
  const className =
    node.tagName === "p"
      ? "plan-paragraph"
      : node.tagName === "pre"
        ? "plan-code"
        : node.tagName === "table"
          ? "plan-table"
          : "plan-list";

  node.properties = node.properties || {};
  node.properties["data-paragraph-id"] = paragraphId;
  (node.properties.className as string[]) = [
    ...((node.properties.className as string[]) || []),
    className,
  ];
}

function visit(
  node: Root | Element,
  fn: (node: Root | Element, sectionId: string) => void,
  sectionId = ""
): void {
  fn(node, sectionId);
  if ("children" in node) {
    for (const child of node.children) {
      if (child.type === "element" || child.type === "root") {
        const sid =
          child.type === "element" &&
          (child as Element).tagName === "section" &&
          (child as Element).properties?.id
            ? String((child as Element).properties.id)
            : sectionId;
        visit(child as Element, fn, sid);
      }
    }
  }
}
