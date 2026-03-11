# PlanShare Phase 1: Core Loop — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete publish → view → comment → approve loop for technical plans.

**Architecture:** pnpm monorepo with 4 packages (app, cli, renderer, convex). Convex handles backend + realtime. Vite + React SPA deployed to Vercel. CLI publishes plans via Convex HTTP endpoints. Shared renderer converts markdown → semantic HTML.

**Tech Stack:** TypeScript, React, Vite, Convex, pnpm workspaces, Vitest, @convex-dev/auth, remark/rehype, commander, inquirer, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-10-planshare-design.md`

**Testing patterns:** Follow WatchList project (`~/Sites/watch_list`) — dual Vitest environments, `convex-test`, factory pattern with `resetFactoryCounter`, `createAuthUser` helper, test through public API.

---

## Chunk 1: Bootstrap & Monorepo Scaffold

### Task 1: Initialize pnpm monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.nvmrc`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "plan-and-share",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @planshare/app dev",
    "build": "pnpm --filter @planshare/app build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "convex"
```

- [ ] **Step 3: Create .nvmrc**

```
22
```

- [ ] **Step 4: Update .gitignore**

Append to existing `.gitignore`:
```
node_modules/
dist/
.env.local
.superpowers/
.vercel/
.turbo/
*.tsbuildinfo
```

- [ ] **Step 5: Run pnpm install**

Run: `pnpm install`
Expected: lockfile created, no errors

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .nvmrc .gitignore
git commit -m "feat: initialize pnpm monorepo"
```

---

### Task 2: Scaffold Vite + React app package

**Files:**
- Create: `packages/app/package.json`
- Create: `packages/app/vite.config.ts`
- Create: `packages/app/tsconfig.json`
- Create: `packages/app/tsconfig.node.json`
- Create: `packages/app/index.html`
- Create: `packages/app/src/main.tsx`
- Create: `packages/app/src/App.tsx`
- Create: `packages/app/src/index.css`

- [ ] **Step 1: Create packages/app via Vite scaffold**

Run: `cd packages && pnpm create vite app --template react-ts`

- [ ] **Step 2: Update packages/app/package.json name**

Set `"name": "@planshare/app"` in the generated package.json.

- [ ] **Step 3: Install Tailwind CSS v4**

Run from `packages/app`:
```bash
pnpm add tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Update `src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 4: Install React Router**

Run: `pnpm add react-router-dom`

- [ ] **Step 5: Create minimal App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return <div className="p-8 text-lg">PlanShare is running.</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Verify dev server starts**

Run: `pnpm --filter @planshare/app dev`
Expected: Vite dev server at http://localhost:5173 showing "PlanShare is running."

- [ ] **Step 7: Commit**

```bash
git add packages/app
git commit -m "feat: scaffold Vite + React + Tailwind app"
```

---

### Task 3: Scaffold renderer package

**Files:**
- Create: `packages/renderer/package.json`
- Create: `packages/renderer/tsconfig.json`
- Create: `packages/renderer/src/index.ts`

- [ ] **Step 1: Create packages/renderer/package.json**

```json
{
  "name": "@planshare/renderer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "rehype-stringify": "^10.0.0",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.0.0",
    "unified": "^11.0.0",
    "github-slugger": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create packages/renderer/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create stub packages/renderer/src/index.ts**

```typescript
export async function renderMarkdown(markdown: string): Promise<{
  html: string;
  paragraphIds: string[];
}> {
  // Stub — will be implemented in Chunk 2
  return { html: "", paragraphIds: [] };
}
```

- [ ] **Step 4: Install dependencies**

Run from root: `pnpm install`

- [ ] **Step 5: Commit**

```bash
git add packages/renderer
git commit -m "feat: scaffold renderer package (stub)"
```

---

### Task 4: Scaffold CLI package

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/index.ts`

- [ ] **Step 1: Create packages/cli/package.json**

```json
{
  "name": "@planshare/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "plan-push": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@planshare/renderer": "workspace:*",
    "commander": "^13.0.0",
    "inquirer": "^12.0.0",
    "open": "^10.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create packages/cli/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create stub packages/cli/src/index.ts**

```typescript
#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("plan-push")
  .description("Publish plans to PlanShare")
  .version("0.1.0");

program
  .command("push <file>")
  .description("Push a markdown plan (interactive)")
  .action((file: string) => {
    console.log(`Would push: ${file}`);
  });

program.parse();
```

- [ ] **Step 4: Install dependencies**

Run from root: `pnpm install`

- [ ] **Step 5: Verify CLI runs**

Run: `pnpm --filter @planshare/cli dev -- push test.md`
Expected: `Would push: test.md`

- [ ] **Step 6: Commit**

```bash
git add packages/cli
git commit -m "feat: scaffold CLI package (stub)"
```

---

### Task 5: Initialize Convex

**Files:**
- Create: `convex/schema.ts`
- Create: `convex/tsconfig.json`
- Create: `convex/_generated/` (auto-generated)

- [ ] **Step 1: Install Convex in the app package**

Run from `packages/app`: `pnpm add convex @convex-dev/auth`

- [ ] **Step 2: Initialize Convex**

Run from root: `npx convex dev --once`

This creates `.env.local` with `VITE_CONVEX_URL` and the `convex/_generated/` directory.

- [ ] **Step 3: Create empty schema stub**

Create `convex/schema.ts`:
```typescript
import { defineSchema } from "convex/server";

export default defineSchema({
  // Tables will be added in Chunk 3
});
```

- [ ] **Step 4: Verify Convex syncs**

Run: `npx convex dev --once`
Expected: Schema pushed successfully, no errors.

- [ ] **Step 5: Wire Convex into the React app**

Update `packages/app/src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
```

- [ ] **Step 6: Verify app still runs with Convex connected**

Run: `pnpm --filter @planshare/app dev`
Expected: App loads, no console errors, Convex WebSocket connects.

- [ ] **Step 7: Commit**

```bash
git add convex packages/app/src/main.tsx packages/app/package.json .env.local
git commit -m "feat: initialize Convex backend"
```

**Note:** `.env.local` contains the deployment URL. Add it to `.gitignore` if not already there. Each developer gets their own via `npx convex dev`.

---

### Task 6: Set up Vitest with dual environments

**Files:**
- Create: `vitest.config.ts` (root)
- Create: `convex/test.setup.ts`
- Create: `packages/app/src/__tests__/setup.ts`

- [ ] **Step 1: Install test dependencies at root**

```bash
pnpm add -D vitest @vitest/coverage-v8
pnpm add -D convex-test -w
pnpm --filter @planshare/app add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create root vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "convex",
          environment: "edge-runtime",
          include: ["convex/**/*.test.ts"],
          setupFiles: [],
        },
      },
      {
        test: {
          name: "renderer",
          environment: "node",
          include: ["packages/renderer/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "app",
          environment: "jsdom",
          include: ["packages/app/src/**/*.test.{ts,tsx}"],
          setupFiles: ["packages/app/src/__tests__/setup.ts"],
        },
      },
      {
        test: {
          name: "cli",
          environment: "node",
          include: ["packages/cli/src/**/*.test.ts"],
        },
      },
    ],
  },
});
```

- [ ] **Step 3: Create convex/test.setup.ts**

```typescript
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");
```

- [ ] **Step 4: Create packages/app/src/__tests__/setup.ts**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Verify vitest runs with no tests**

Run: `pnpm test`
Expected: "No test files found" or similar — no errors.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts convex/test.setup.ts packages/app/src/__tests__/setup.ts package.json pnpm-lock.yaml
git commit -m "feat: set up Vitest with dual environments"
```

---

### Task 7: Push to GitHub and connect Vercel

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create planshare --private --source=. --push
```

- [ ] **Step 2: Connect Vercel**

```bash
vercel link
# Select your account, create new project
# Framework: Vite
# Root directory: packages/app
```

- [ ] **Step 3: Set Vercel env var**

```bash
vercel env add VITE_CONVEX_URL
# Paste the URL from .env.local
```

- [ ] **Step 4: Deploy**

```bash
vercel --prod
```
Expected: Deployment succeeds, live URL shows "PlanShare is running."

- [ ] **Step 5: Commit any Vercel config**

```bash
git add vercel.json .vercel 2>/dev/null; git commit -m "feat: connect Vercel deployment" || echo "Nothing to commit"
```

---

## Chunk 2: Shared Markdown Renderer

### Task 8: Implement core markdown → HTML pipeline

**Files:**
- Create: `packages/renderer/src/index.ts` (replace stub)
- Create: `packages/renderer/src/plugins/paragraph-ids.ts`
- Create: `packages/renderer/src/plugins/semantic-classes.ts`
- Test: `packages/renderer/src/__tests__/render.test.ts`

- [ ] **Step 1: Write failing test — basic markdown renders to HTML**

Create `packages/renderer/src/__tests__/render.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../index";

describe("renderMarkdown", () => {
  it("renders a heading and paragraph to HTML", async () => {
    const md = "# Hello World\n\nThis is a paragraph.";
    const { html } = await renderMarkdown(md);

    expect(html).toContain('<h2 class="plan-heading"');
    expect(html).toContain("Hello World");
    expect(html).toContain('<div class="plan-paragraph"');
    expect(html).toContain("This is a paragraph.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --project renderer`
Expected: FAIL — stub returns empty string.

- [ ] **Step 3: Implement the remark/rehype pipeline**

Replace `packages/renderer/src/index.ts`:
```typescript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { paragraphIds } from "./plugins/paragraph-ids";
import { semanticClasses } from "./plugins/semantic-classes";

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
```

- [ ] **Step 4: Implement semantic-classes plugin**

Create `packages/renderer/src/plugins/semantic-classes.ts`:
```typescript
import type { Root, Element } from "hast";
import type { Plugin } from "unified";
import GithubSlugger from "github-slugger";

const SECTION_TYPE_MAP: Record<string, string> = {
  "executive-summary": "summary",
  "background-context": "background",
  "goals-non-goals": "goals",
  "technical-architecture": "technical",
  "implementation-approach": "implementation",
  "test-coverage-plan": "testing",
  "rollout-migration": "rollout",
  "open-questions": "questions",
  "risks-mitigations": "risks",
};

export const semanticClasses: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    const children = tree.children as Element[];
    const newChildren: Element[] = [];
    let currentSection: Element | null = null;
    let currentSlug = "";

    for (const node of children) {
      if (node.type === "element" && node.tagName === "h2") {
        // Close previous section
        if (currentSection) {
          newChildren.push(currentSection);
        }

        const text = getTextContent(node);
        currentSlug = slugger.slug(text);
        const sectionType = SECTION_TYPE_MAP[currentSlug] || currentSlug;

        // Add class to heading
        node.properties = node.properties || {};
        node.properties.className = ["plan-heading"];

        // Start new section
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
        currentSection.children.push(node);
      } else {
        // Content before first h2 (metadata block, h1 title)
        if (node.type === "element" && node.tagName === "h1") {
          node.properties = node.properties || {};
          node.properties.className = ["plan-title"];
        }
        newChildren.push(node);
      }
    }

    if (currentSection) {
      newChildren.push(currentSection);
    }

    tree.children = newChildren;
  };
};

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
```

- [ ] **Step 5: Implement paragraph-ids plugin**

Create `packages/renderer/src/plugins/paragraph-ids.ts`:
```typescript
import type { Root, Element } from "hast";
import type { Plugin } from "unified";

interface ParagraphIdsOptions {
  onId: (id: string) => void;
}

export const paragraphIds: Plugin<[ParagraphIdsOptions], Root> = (options) => {
  return (tree: Root) => {
    const { onId } = options;

    visit(tree, (node, sectionId) => {
      if (node.type !== "element") return;

      const el = node as Element;

      // Track current section ID from sections created by semantic-classes plugin
      if (el.tagName === "section" && el.properties?.id) {
        const sid = String(el.properties.id);
        let pCount = 0;
        let dCount = 0;

        for (const child of el.children) {
          if ((child as Element).type !== "element") continue;
          const childEl = child as Element;

          if (childEl.tagName === "p") {
            pCount++;
            const paraId = `${sid}-p${pCount}`;
            wrapInCommentable(childEl, paraId, el);
            onId(paraId);
          } else if (
            childEl.tagName === "pre" ||
            childEl.tagName === "table" ||
            childEl.tagName === "ul" ||
            childEl.tagName === "ol"
          ) {
            const tag = childEl.tagName;
            const suffix =
              tag === "pre" ? "code" : tag === "table" ? "table" : "list";
            dCount++;
            const paraId = `${sid}-${suffix}${dCount}`;
            wrapInCommentable(childEl, paraId, el);
            onId(paraId);
          }
        }
      }
    });
  };
};

function wrapInCommentable(
  node: Element,
  paragraphId: string,
  _parent: Element
): void {
  // Mutate in place: wrap the node's children in a div.plan-paragraph
  // We modify the node's properties to add the data attribute and class
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- --project renderer`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/renderer
git commit -m "feat: implement markdown → semantic HTML renderer"
```

---

### Task 9: Test paragraph ID generation

**Files:**
- Test: `packages/renderer/src/__tests__/render.test.ts` (extend)

- [ ] **Step 1: Write failing test — paragraph IDs are generated**

Add to `render.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests**

Run: `pnpm test -- --project renderer`
Expected: All PASS (implementation already handles these cases).

- [ ] **Step 3: Write edge case test — empty markdown**

```typescript
it("handles empty markdown", async () => {
  const { html, paragraphIds } = await renderMarkdown("");
  expect(html).toContain('class="plan-content"');
  expect(paragraphIds).toEqual([]);
});

it("handles markdown with no h2 sections", async () => {
  const md = "# Title\n\nJust a paragraph with no sections.";
  const { html, paragraphIds } = await renderMarkdown(md);
  expect(html).toContain("Just a paragraph");
  // No sections means no paragraph IDs (content before first h2 is unanchored)
  expect(paragraphIds).toEqual([]);
});
```

- [ ] **Step 4: Run all renderer tests**

Run: `pnpm test -- --project renderer`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/renderer
git commit -m "test: paragraph ID generation and edge cases"
```

---

## Chunk 3: Convex Schema & Core Mutations

### Task 10: Define full Convex schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Write the complete schema**

Replace `convex/schema.ts`:
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    invitedBy: v.optional(v.id("users")),
    status: v.union(v.literal("active"), v.literal("deactivated")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  folders: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  plans: defineTable({
    folderId: v.id("folders"),
    title: v.string(),
    slug: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    currentVersionId: v.optional(v.id("planVersions")),
    createdBy: v.id("users"),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_folder", ["folderId"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  planVersions: defineTable({
    planId: v.id("plans"),
    version: v.number(),
    markdownContent: v.string(),
    htmlContent: v.string(),
    summary: v.optional(v.string()),
    pushedBy: v.id("users"),
    pushedAt: v.number(),
    changeNote: v.optional(v.string()),
  }).index("by_plan", ["planId"]),

  comments: defineTable({
    planId: v.id("plans"),
    versionId: v.id("planVersions"),
    paragraphId: v.string(),
    body: v.string(),
    authorId: v.id("users"),
    resolved: v.boolean(),
    resolvedInVersionId: v.optional(v.id("planVersions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_version", ["versionId"])
    .index("by_paragraph", ["versionId", "paragraphId"]),

  commentReplies: defineTable({
    commentId: v.id("comments"),
    body: v.string(),
    authorId: v.id("users"),
    createdAt: v.number(),
  }).index("by_comment", ["commentId"]),

  reviews: defineTable({
    planId: v.id("plans"),
    versionId: v.id("planVersions"),
    action: v.union(v.literal("approved"), v.literal("changes_requested")),
    note: v.optional(v.string()),
    authorId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_version", ["versionId"]),

  invites: defineTable({
    email: v.string(),
    invitedBy: v.id("users"),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
```

- [ ] **Step 2: Push schema to Convex**

Run: `npx convex dev --once`
Expected: Schema pushed, tables created.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: define full Convex schema with all tables and indexes"
```

---

### Task 11: Create test factories

**Files:**
- Create: `convex/test.factories.ts`

- [ ] **Step 1: Implement all factories**

Create `convex/test.factories.ts`:
```typescript
import { TestConvex } from "convex-test";
import schema from "./schema";

type TestCtx = TestConvex<typeof schema>;

let counter = 0;
const nextId = () => ++counter;
export const resetFactoryCounter = () => {
  counter = 0;
};

export async function createUser(
  t: TestCtx,
  overrides: {
    email?: string;
    name?: string;
    role?: "admin" | "member";
    status?: "active" | "deactivated";
  } = {}
) {
  const n = nextId();
  const userId = await t.run(async (ctx) => {
    return ctx.db.insert("users", {
      tokenIdentifier: `test-token-${n}`,
      email: overrides.email ?? `testuser${n}@example.com`,
      name: overrides.name ?? `Test User ${n}`,
      role: overrides.role ?? "member",
      status: overrides.status ?? "active",
      createdAt: Date.now(),
    });
  });
  return userId;
}

export async function createAuthUser(
  t: TestCtx,
  overrides: Parameters<typeof createUser>[1] = {}
) {
  const userId = await createUser(t, overrides);
  await t.run(async (ctx) => {
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "google" as any,
      providerAccountId: `google-${userId}`,
    } as any);
  });
  return {
    userId,
    identity: t.withIdentity({ subject: `${userId}|google` }),
  };
}

export async function createFolder(
  t: TestCtx,
  overrides: {
    name?: string;
    slug?: string;
    createdBy?: any;
  } = {}
) {
  const n = nextId();
  const createdBy = overrides.createdBy ?? (await createUser(t));
  const name = overrides.name ?? `Test Folder ${n}`;
  const slug = overrides.slug ?? `test-folder-${n}`;

  const folderId = await t.run(async (ctx) => {
    return ctx.db.insert("folders", {
      name,
      slug,
      createdBy,
      createdAt: Date.now(),
    });
  });
  return { folderId, createdBy };
}

export async function createPlan(
  t: TestCtx,
  overrides: {
    folderId?: any;
    title?: string;
    slug?: string;
    status?: "draft" | "in_review" | "approved" | "rejected";
    createdBy?: any;
  } = {}
) {
  const n = nextId();
  const createdBy = overrides.createdBy ?? (await createUser(t));
  let folderId = overrides.folderId;
  if (!folderId) {
    const folder = await createFolder(t, { createdBy });
    folderId = folder.folderId;
  }

  const now = Date.now();
  const planId = await t.run(async (ctx) => {
    return ctx.db.insert("plans", {
      folderId,
      title: overrides.title ?? `Test Plan ${n}`,
      slug: overrides.slug ?? `test-plan-${n}`,
      status: overrides.status ?? "draft",
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
  });
  return { planId, folderId, createdBy };
}

export async function createPlanVersion(
  t: TestCtx,
  overrides: {
    planId?: any;
    version?: number;
    markdownContent?: string;
    htmlContent?: string;
    pushedBy?: any;
    changeNote?: string;
  } = {}
) {
  const n = nextId();
  let planId = overrides.planId;
  let pushedBy = overrides.pushedBy;

  if (!planId) {
    const plan = await createPlan(t);
    planId = plan.planId;
    pushedBy = pushedBy ?? plan.createdBy;
  }
  if (!pushedBy) {
    pushedBy = await createUser(t);
  }

  const versionId = await t.run(async (ctx) => {
    return ctx.db.insert("planVersions", {
      planId,
      version: overrides.version ?? 1,
      markdownContent: overrides.markdownContent ?? `# Plan ${n}\n\nContent.`,
      htmlContent:
        overrides.htmlContent ?? `<article class="plan-content"><p>Content.</p></article>`,
      pushedBy,
      pushedAt: Date.now(),
      changeNote: overrides.changeNote,
    });
  });

  // Update plan's currentVersionId
  await t.run(async (ctx) => {
    await ctx.db.patch(planId, { currentVersionId: versionId });
  });

  return { versionId, planId, pushedBy };
}

export async function createComment(
  t: TestCtx,
  overrides: {
    planId?: any;
    versionId?: any;
    paragraphId?: string;
    body?: string;
    authorId?: any;
    resolved?: boolean;
  } = {}
) {
  const n = nextId();
  let versionId = overrides.versionId;
  let planId = overrides.planId;
  const authorId = overrides.authorId ?? (await createUser(t));

  if (!versionId) {
    const ver = await createPlanVersion(t);
    versionId = ver.versionId;
    planId = planId ?? ver.planId;
  }

  const commentId = await t.run(async (ctx) => {
    return ctx.db.insert("comments", {
      planId: planId!,
      versionId,
      paragraphId: overrides.paragraphId ?? `section-p${n}`,
      body: overrides.body ?? `Test comment ${n}`,
      authorId,
      resolved: overrides.resolved ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { commentId, planId, versionId, authorId };
}

export async function createInvite(
  t: TestCtx,
  overrides: {
    email?: string;
    invitedBy?: any;
  } = {}
) {
  const n = nextId();
  const invitedBy = overrides.invitedBy ?? (await createUser(t, { role: "admin" }));

  const inviteId = await t.run(async (ctx) => {
    return ctx.db.insert("invites", {
      email: overrides.email ?? `invite${n}@example.com`,
      invitedBy,
      createdAt: Date.now(),
    });
  });

  return { inviteId, invitedBy };
}
```

- [ ] **Step 2: Commit**

```bash
git add convex/test.factories.ts
git commit -m "feat: add Convex test factories for all tables"
```

---

### Task 12: Implement folder queries and mutations

**Files:**
- Create: `convex/folders.ts`
- Test: `convex/folders.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/folders.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";
import {
  resetFactoryCounter,
  createAuthUser,
  createFolder,
} from "./test.factories";

describe("folders", () => {
  beforeEach(resetFactoryCounter);

  it("lists all folders excluding deleted", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);

    await createFolder(t, { name: "Active", createdBy: userId });
    const { folderId: deletedId } = await createFolder(t, {
      name: "Deleted",
      createdBy: userId,
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(deletedId, { deletedAt: Date.now() });
    });

    const folders = await asUser.query(api.folders.list, {});
    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe("Active");
  });

  it("creates a folder with a slug", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);

    const folderId = await asUser.mutation(api.folders.create, {
      name: "Platform Redesign",
    });

    const folder = await t.run(async (ctx) => ctx.db.get(folderId));
    expect(folder?.name).toBe("Platform Redesign");
    expect(folder?.slug).toBe("platform-redesign");
    expect(folder?.createdBy).toBe(userId);
  });

  it("rejects unauthenticated access", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.folders.list, {})).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --project convex`
Expected: FAIL — `api.folders` doesn't exist yet.

- [ ] **Step 3: Implement folders.ts**

Create `convex/folders.ts`:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import GithubSlugger from "github-slugger";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const folders = await ctx.db.query("folders").collect();
    return folders.filter((f) => !f.deletedAt);
  },
});

export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const slugger = new GithubSlugger();
    const slug = slugger.slug(args.name);

    return ctx.db.insert("folders", {
      name: args.name,
      slug,
      description: args.description,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});
```

**Note:** `github-slugger` needs to be added to Convex dependencies. Add to root `package.json` or install in the convex workspace. Since convex functions run on Convex's servers, the dependency must be bundled — add `"github-slugger": "^2.0.0"` to the root `package.json` dependencies.

- [ ] **Step 4: Run tests**

Run: `pnpm test -- --project convex`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add convex/folders.ts convex/folders.test.ts package.json
git commit -m "feat: folder queries and mutations with tests"
```

---

### Task 13: Implement plan mutations (create + push version)

**Files:**
- Create: `convex/plans.ts`
- Create: `convex/planVersions.ts`
- Test: `convex/plans.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/plans.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";
import {
  resetFactoryCounter,
  createAuthUser,
  createFolder,
  createPlan,
  createPlanVersion,
} from "./test.factories";

describe("plans", () => {
  beforeEach(resetFactoryCounter);

  it("creates a plan with initial version", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const result = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "Auth Overhaul",
      markdownContent: "# Auth Overhaul\n\nRedesign auth.",
      htmlContent: "<article>...</article>",
    });

    expect(result.planId).toBeDefined();
    expect(result.versionId).toBeDefined();

    const plan = await t.run(async (ctx) => ctx.db.get(result.planId));
    expect(plan?.title).toBe("Auth Overhaul");
    expect(plan?.slug).toBe("auth-overhaul");
    expect(plan?.status).toBe("draft");
    expect(plan?.currentVersionId).toBe(result.versionId);

    const version = await t.run(async (ctx) => ctx.db.get(result.versionId));
    expect(version?.version).toBe(1);
    expect(version?.planId).toBe(result.planId);
  });

  it("pushes a new version and updates currentVersionId", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const { planId } = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "Auth Overhaul",
      markdownContent: "# V1",
      htmlContent: "<article>V1</article>",
    });

    const v2Id = await asUser.mutation(api.planVersions.push, {
      planId,
      markdownContent: "# V2",
      htmlContent: "<article>V2</article>",
      changeNote: "Addressed feedback",
    });

    const plan = await t.run(async (ctx) => ctx.db.get(planId));
    expect(plan?.currentVersionId).toBe(v2Id);

    const v2 = await t.run(async (ctx) => ctx.db.get(v2Id));
    expect(v2?.version).toBe(2);
    expect(v2?.changeNote).toBe("Addressed feedback");
  });

  it("lists plans in a folder excluding deleted", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    await createPlan(t, { folderId, createdBy: userId, title: "Plan A" });
    const { planId: deletedPlan } = await createPlan(t, {
      folderId,
      createdBy: userId,
      title: "Deleted Plan",
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(deletedPlan, { deletedAt: Date.now() });
    });

    const plans = await asUser.query(api.plans.listByFolder, { folderId });
    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe("Plan A");
  });

  it("auto-moves rejected plan back to in_review on new version push", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const { planId } = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "Plan",
      markdownContent: "# Plan",
      htmlContent: "<article>Plan</article>",
    });

    // Manually set to rejected
    await t.run(async (ctx) => {
      await ctx.db.patch(planId, { status: "rejected" });
    });

    // Push new version
    await asUser.mutation(api.planVersions.push, {
      planId,
      markdownContent: "# V2",
      htmlContent: "<article>V2</article>",
    });

    const plan = await t.run(async (ctx) => ctx.db.get(planId));
    expect(plan?.status).toBe("in_review");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --project convex`
Expected: FAIL

- [ ] **Step 3: Implement plans.ts**

Create `convex/plans.ts`:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import GithubSlugger from "github-slugger";

export const listByFolder = query({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plans = await ctx.db
      .query("plans")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .collect();

    return plans.filter((p) => !p.deletedAt);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plan = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!plan || plan.deletedAt) return null;
    return plan;
  },
});

export const createWithVersion = mutation({
  args: {
    folderId: v.id("folders"),
    title: v.string(),
    markdownContent: v.string(),
    htmlContent: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const slugger = new GithubSlugger();
    const slug = slugger.slug(args.title);
    const now = Date.now();

    const planId = await ctx.db.insert("plans", {
      folderId: args.folderId,
      title: args.title,
      slug,
      status: "draft",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const versionId = await ctx.db.insert("planVersions", {
      planId,
      version: 1,
      markdownContent: args.markdownContent,
      htmlContent: args.htmlContent,
      summary: args.summary,
      pushedBy: userId,
      pushedAt: now,
    });

    await ctx.db.patch(planId, { currentVersionId: versionId });

    return { planId, versionId };
  },
});

export const updateStatus = mutation({
  args: {
    planId: v.id("plans"),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.planId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
```

- [ ] **Step 4: Implement planVersions.ts**

Create `convex/planVersions.ts`:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db
      .query("planVersions")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
  },
});

export const get = query({
  args: { versionId: v.id("planVersions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.get(args.versionId);
  },
});

export const push = mutation({
  args: {
    planId: v.id("plans"),
    markdownContent: v.string(),
    htmlContent: v.string(),
    summary: v.optional(v.string()),
    changeNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    // Get current highest version number
    const existingVersions = await ctx.db
      .query("planVersions")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const nextVersion = existingVersions.length + 1;

    const versionId = await ctx.db.insert("planVersions", {
      planId: args.planId,
      version: nextVersion,
      markdownContent: args.markdownContent,
      htmlContent: args.htmlContent,
      summary: args.summary,
      pushedBy: userId,
      pushedAt: Date.now(),
      changeNote: args.changeNote,
    });

    // Update plan's current version
    const updates: Record<string, any> = {
      currentVersionId: versionId,
      updatedAt: Date.now(),
    };

    // Auto-move rejected plans back to in_review
    if (plan.status === "rejected") {
      updates.status = "in_review";
    }

    await ctx.db.patch(args.planId, updates);

    return versionId;
  },
});
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- --project convex`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add convex/plans.ts convex/planVersions.ts convex/plans.test.ts
git commit -m "feat: plan and version mutations with state machine tests"
```

---

### Task 14: Implement comments and replies

**Files:**
- Create: `convex/comments.ts`
- Test: `convex/comments.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/comments.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";
import {
  resetFactoryCounter,
  createAuthUser,
  createPlanVersion,
  createComment,
} from "./test.factories";

describe("comments", () => {
  beforeEach(resetFactoryCounter);

  it("creates a comment on a paragraph", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { versionId, planId } = await createPlanVersion(t);

    const commentId = await asUser.mutation(api.comments.create, {
      planId,
      versionId,
      paragraphId: "executive-summary-p1",
      body: "This needs more detail.",
    });

    const comment = await t.run(async (ctx) => ctx.db.get(commentId));
    expect(comment?.body).toBe("This needs more detail.");
    expect(comment?.authorId).toBe(userId);
    expect(comment?.resolved).toBe(false);
  });

  it("lists comments for a version", async () => {
    const t = convexTest(schema, modules);
    const { identity: asUser } = await createAuthUser(t);
    const { versionId, planId } = await createPlanVersion(t);

    const { commentId: c1 } = await createComment(t, {
      versionId,
      planId,
      paragraphId: "p1",
    });
    const { commentId: c2 } = await createComment(t, {
      versionId,
      planId,
      paragraphId: "p2",
    });

    const comments = await asUser.query(api.comments.listByVersion, {
      versionId,
    });
    expect(comments).toHaveLength(2);
  });

  it("adds a reply to a comment", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { commentId } = await createComment(t);

    const replyId = await asUser.mutation(api.comments.reply, {
      commentId,
      body: "Good point, will fix.",
    });

    const reply = await t.run(async (ctx) => ctx.db.get(replyId));
    expect(reply?.body).toBe("Good point, will fix.");
    expect(reply?.authorId).toBe(userId);
  });

  it("resolves a comment", async () => {
    const t = convexTest(schema, modules);
    const { identity: asUser } = await createAuthUser(t);
    const { commentId } = await createComment(t);

    await asUser.mutation(api.comments.resolve, {
      commentId,
      resolved: true,
    });

    const comment = await t.run(async (ctx) => ctx.db.get(commentId));
    expect(comment?.resolved).toBe(true);
  });

  it("lists replies for a comment", async () => {
    const t = convexTest(schema, modules);
    const { identity: asUser } = await createAuthUser(t);
    const { commentId } = await createComment(t);

    await t.run(async (ctx) => {
      const authorId = (await ctx.db.get(commentId))!.authorId;
      await ctx.db.insert("commentReplies", {
        commentId,
        body: "Reply 1",
        authorId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("commentReplies", {
        commentId,
        body: "Reply 2",
        authorId,
        createdAt: Date.now(),
      });
    });

    const replies = await asUser.query(api.comments.listReplies, {
      commentId,
    });
    expect(replies).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --project convex`
Expected: FAIL

- [ ] **Step 3: Implement comments.ts**

Create `convex/comments.ts`:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByVersion = query({
  args: { versionId: v.id("planVersions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db
      .query("comments")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .collect();
  },
});

export const listByPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db
      .query("comments")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
  },
});

export const listReplies = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db
      .query("commentReplies")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();
  },
});

export const create = mutation({
  args: {
    planId: v.id("plans"),
    versionId: v.id("planVersions"),
    paragraphId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return ctx.db.insert("comments", {
      planId: args.planId,
      versionId: args.versionId,
      paragraphId: args.paragraphId,
      body: args.body,
      authorId: userId,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reply = mutation({
  args: {
    commentId: v.id("comments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("commentReplies", {
      commentId: args.commentId,
      body: args.body,
      authorId: userId,
      createdAt: Date.now(),
    });
  },
});

export const resolve = mutation({
  args: {
    commentId: v.id("comments"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.commentId, {
      resolved: args.resolved,
      updatedAt: Date.now(),
    });
  },
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm test -- --project convex`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add convex/comments.ts convex/comments.test.ts
git commit -m "feat: comment and reply mutations with tests"
```

---

### Task 15: Implement reviews (approve / request changes)

**Files:**
- Create: `convex/reviews.ts`
- Test: `convex/reviews.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/reviews.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";
import {
  resetFactoryCounter,
  createAuthUser,
  createPlan,
  createPlanVersion,
  createFolder,
} from "./test.factories";

describe("reviews", () => {
  beforeEach(resetFactoryCounter);

  it("creates an approval review and updates plan status", async () => {
    const t = convexTest(schema, modules);
    const { userId: authorId } = await createAuthUser(t);
    const { userId: reviewerId, identity: asReviewer } = await createAuthUser(t);

    const { folderId } = await createFolder(t, { createdBy: authorId });
    const { planId } = await createPlan(t, {
      folderId,
      createdBy: authorId,
      status: "in_review",
    });
    const { versionId } = await createPlanVersion(t, {
      planId,
      pushedBy: authorId,
    });

    const reviewId = await asReviewer.mutation(api.reviews.submit, {
      planId,
      versionId,
      action: "approved",
      note: "Looks great, ship it.",
    });

    const review = await t.run(async (ctx) => ctx.db.get(reviewId));
    expect(review?.action).toBe("approved");
    expect(review?.authorId).toBe(reviewerId);

    const plan = await t.run(async (ctx) => ctx.db.get(planId));
    expect(plan?.status).toBe("approved");
  });

  it("creates a changes_requested review and updates plan status", async () => {
    const t = convexTest(schema, modules);
    const { userId: authorId } = await createAuthUser(t);
    const { identity: asReviewer } = await createAuthUser(t);

    const { folderId } = await createFolder(t, { createdBy: authorId });
    const { planId } = await createPlan(t, {
      folderId,
      createdBy: authorId,
      status: "in_review",
    });
    const { versionId } = await createPlanVersion(t, {
      planId,
      pushedBy: authorId,
    });

    await asReviewer.mutation(api.reviews.submit, {
      planId,
      versionId,
      action: "changes_requested",
      note: "Need cost analysis.",
    });

    const plan = await t.run(async (ctx) => ctx.db.get(planId));
    expect(plan?.status).toBe("rejected");
  });

  it("lists reviews for a plan (timeline)", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });
    const { planId } = await createPlan(t, {
      folderId,
      createdBy: userId,
      status: "in_review",
    });
    const { versionId } = await createPlanVersion(t, {
      planId,
      pushedBy: userId,
    });

    await asUser.mutation(api.reviews.submit, {
      planId,
      versionId,
      action: "approved",
    });

    const reviews = await asUser.query(api.reviews.listByPlan, { planId });
    expect(reviews).toHaveLength(1);
    expect(reviews[0].action).toBe("approved");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --project convex`
Expected: FAIL

- [ ] **Step 3: Implement reviews.ts**

Create `convex/reviews.ts`:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db
      .query("reviews")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
  },
});

export const submit = mutation({
  args: {
    planId: v.id("plans"),
    versionId: v.id("planVersions"),
    action: v.union(v.literal("approved"), v.literal("changes_requested")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reviewId = await ctx.db.insert("reviews", {
      planId: args.planId,
      versionId: args.versionId,
      action: args.action,
      note: args.note,
      authorId: userId,
      createdAt: Date.now(),
    });

    // Update plan status based on review action
    const newStatus = args.action === "approved" ? "approved" : "rejected";
    await ctx.db.patch(args.planId, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    return reviewId;
  },
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm test -- --project convex`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add convex/reviews.ts convex/reviews.test.ts
git commit -m "feat: review submissions with plan status updates"
```

---

### Task 16: Implement invite and user management

**Files:**
- Create: `convex/invites.ts`
- Create: `convex/users.ts`
- Test: `convex/users.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/users.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";
import {
  resetFactoryCounter,
  createAuthUser,
  createUser,
  createInvite,
} from "./test.factories";

describe("users", () => {
  beforeEach(resetFactoryCounter);

  it("lists active users", async () => {
    const t = convexTest(schema, modules);
    const { identity: asAdmin } = await createAuthUser(t, { role: "admin" });
    await createUser(t, { name: "Alice" });
    await createUser(t, { name: "Bob", status: "deactivated" });

    const users = await asAdmin.query(api.users.list, {});
    // includes the admin + Alice (Bob is deactivated)
    const activeNames = users.map((u: any) => u.name);
    expect(activeNames).toContain("Alice");
    expect(activeNames).not.toContain("Bob");
  });
});

describe("invites", () => {
  beforeEach(resetFactoryCounter);

  it("admin can create an invite", async () => {
    const t = convexTest(schema, modules);
    const { identity: asAdmin } = await createAuthUser(t, { role: "admin" });

    const inviteId = await asAdmin.mutation(api.invites.create, {
      email: "newuser@example.com",
    });

    const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
    expect(invite?.email).toBe("newuser@example.com");
  });

  it("non-admin cannot create an invite", async () => {
    const t = convexTest(schema, modules);
    const { identity: asMember } = await createAuthUser(t, { role: "member" });

    await expect(
      asMember.mutation(api.invites.create, { email: "x@example.com" })
    ).rejects.toThrow("Admin access required");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --project convex`
Expected: FAIL

- [ ] **Step 3: Implement users.ts**

Create `convex/users.ts`:
```typescript
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.status === "active");
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return ctx.db.get(userId);
  },
});
```

- [ ] **Step 4: Implement invites.ts**

Create `convex/invites.ts`:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Admin access required");

    return ctx.db.query("invites").collect();
  },
});

export const create = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Admin access required");

    // Check for existing invite
    const existing = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) throw new Error("Email already invited");

    return ctx.db.insert("invites", {
      email: args.email,
      invitedBy: userId,
      createdAt: Date.now(),
    });
  },
});
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- --project convex`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add convex/users.ts convex/invites.ts convex/users.test.ts
git commit -m "feat: user listing and admin-only invite management"
```

---

### Task 17: Implement HTTP endpoints for CLI

**Files:**
- Create: `convex/http.ts`
- Test: `convex/http.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/http.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";
import {
  resetFactoryCounter,
  createAuthUser,
  createFolder,
} from "./test.factories";

describe("HTTP endpoints (via mutations)", () => {
  beforeEach(resetFactoryCounter);

  // HTTP endpoints are tested via their underlying mutations
  // since convex-test doesn't support HTTP route testing directly.
  // The HTTP handler delegates to the same mutations.

  it("push creates a new plan via createWithVersion", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const result = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "CLI Push Test",
      markdownContent: "# Test\n\nPushed from CLI.",
      htmlContent: "<article>Test</article>",
    });

    expect(result.planId).toBeDefined();
    expect(result.versionId).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement http.ts**

Create `convex/http.ts`:
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/folders",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // CLI sends auth token in Authorization header
    // For now, delegate to the query (auth handled by Convex)
    const folders = await ctx.runQuery(api.folders.list, {});
    return new Response(JSON.stringify(folders), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/plans",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const folderId = url.searchParams.get("folderId");
    if (!folderId) {
      return new Response(JSON.stringify({ error: "folderId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const plans = await ctx.runQuery(api.plans.listByFolder, {
      folderId: folderId as any,
    });
    return new Response(JSON.stringify(plans), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/push",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { folderId, planId, title, markdownContent, htmlContent, changeNote } =
      body;

    let result;
    if (planId) {
      // Update existing plan
      const versionId = await ctx.runMutation(api.planVersions.push, {
        planId,
        markdownContent,
        htmlContent,
        changeNote,
      });
      result = { planId, versionId };
    } else {
      // Create new plan
      result = await ctx.runMutation(api.plans.createWithVersion, {
        folderId,
        title,
        markdownContent,
        htmlContent,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

- [ ] **Step 3: Push to Convex and verify**

Run: `npx convex dev --once`
Expected: HTTP routes registered.

- [ ] **Step 4: Commit**

```bash
git add convex/http.ts convex/http.test.ts
git commit -m "feat: HTTP endpoints for CLI push, folders, plans"
```

---

**End of Chunks 1-3.** This covers bootstrap, renderer, and the full Convex backend.

Remaining chunks to write:
- **Chunk 4:** Web App — Auth, Layout Shell, Router, Theme
- **Chunk 5:** Web App — Folder View, Plan View, Version Switcher
- **Chunk 6:** Web App — Comments UI, Review Timeline, Approve/Reject
- **Chunk 7:** CLI — Auth, Commands, Interactive Push
- **Chunk 8:** Integration Testing, Copy-to-Linear, Final Polish

---

Want me to continue writing Chunks 4-8, or shall we review Chunks 1-3 first?
