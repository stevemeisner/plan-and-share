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

## Chunk 4: Web App — Auth, Layout Shell, Router, Theme

### Task 18: Set up Convex auth with Google OAuth

**Files:**
- Create: `convex/auth.ts`
- Modify: `packages/app/src/main.tsx`
- Create: `packages/app/src/lib/auth.tsx`

- [ ] **Step 1: Install @convex-dev/auth in the app**

Run: `pnpm --filter @planshare/app add @convex-dev/auth`

- [ ] **Step 2: Create convex/auth.ts**

```typescript
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google],
});
```

- [ ] **Step 3: Create packages/app/src/lib/auth.tsx**

```tsx
import { useConvexAuth } from "convex/react";
import { ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white mb-4">PlanShare</h1>
        <p className="text-gray-400 mb-8">Sign in to view and review plans.</p>
        <button
          onClick={() => {
            // Will be wired to Convex auth signIn
          }}
          className="px-6 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire auth into main.tsx**

Update `packages/app/src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </React.StrictMode>
);
```

- [ ] **Step 5: Verify the app renders the login page**

Run: `pnpm --filter @planshare/app dev`
Expected: App shows login page (Google auth won't work yet without env vars, but UI renders).

- [ ] **Step 6: Commit**

```bash
git add convex/auth.ts packages/app/src/lib/auth.tsx packages/app/src/main.tsx
git commit -m "feat: set up Convex auth with Google OAuth provider"
```

---

### Task 19: Create CSS theme system with dark/light mode

**Files:**
- Create: `packages/app/src/styles/theme.css`
- Create: `packages/app/src/lib/theme.ts`
- Modify: `packages/app/src/index.css`

- [ ] **Step 1: Create packages/app/src/styles/theme.css**

```css
:root {
  /* Surface */
  --plan-bg: #ffffff;
  --plan-bg-secondary: #f6f8fa;
  --plan-bg-hover: #f0f2f5;
  --plan-bg-tertiary: #eaeef2;

  /* Text */
  --plan-text-primary: #1a1a2e;
  --plan-text-secondary: #656d76;
  --plan-text-heading: #0d1117;
  --plan-text-muted: #8b949e;

  /* Borders */
  --plan-border: #d0d7de;
  --plan-border-subtle: #e8eaed;

  /* Interactive */
  --plan-accent: #0969da;
  --plan-accent-hover: #0553b1;
  --plan-success: #1a7f37;
  --plan-success-bg: #dafbe1;
  --plan-danger: #cf222e;
  --plan-danger-bg: #ffebe9;
  --plan-warning: #9a6700;

  /* Comments */
  --plan-comment-bg: #f6f8fa;
  --plan-comment-highlight: rgba(9, 105, 218, 0.08);
  --plan-comment-border: #0969da;

  /* Code */
  --plan-code-bg: #f6f8fa;
  --plan-code-text: #1a1a2e;

  /* Spacing */
  --plan-content-width: 780px;
  --plan-paragraph-gap: 1rem;
  --plan-section-gap: 2.5rem;

  /* Typography */
  --plan-font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --plan-font-mono: "SF Mono", SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  --plan-font-size: 15px;
  --plan-line-height: 1.7;

  /* Sidebar */
  --sidebar-width: 260px;
  --sidebar-bg: #f6f8fa;
  --sidebar-border: #d0d7de;
}

[data-theme="dark"] {
  --plan-bg: #0d1117;
  --plan-bg-secondary: #161b22;
  --plan-bg-hover: #1c2128;
  --plan-bg-tertiary: #21262d;

  --plan-text-primary: #c9d1d9;
  --plan-text-secondary: #8b949e;
  --plan-text-heading: #f0f6fc;
  --plan-text-muted: #484f58;

  --plan-border: #30363d;
  --plan-border-subtle: #21262d;

  --plan-accent: #58a6ff;
  --plan-accent-hover: #79c0ff;
  --plan-success: #3fb950;
  --plan-success-bg: rgba(63, 185, 80, 0.15);
  --plan-danger: #f85149;
  --plan-danger-bg: rgba(248, 81, 73, 0.15);
  --plan-warning: #d29922;

  --plan-comment-bg: #161b22;
  --plan-comment-highlight: rgba(88, 166, 255, 0.08);
  --plan-comment-border: #58a6ff;

  --plan-code-bg: #161b22;
  --plan-code-text: #c9d1d9;

  --sidebar-bg: #161b22;
  --sidebar-border: #30363d;
}
```

- [ ] **Step 2: Create packages/app/src/lib/theme.ts**

```typescript
export function getInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem("planshare-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("planshare-theme", theme);
}

export function toggleTheme(): "light" | "dark" {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
```

- [ ] **Step 3: Update packages/app/src/index.css**

```css
@import "tailwindcss";
@import "./styles/theme.css";

body {
  background-color: var(--plan-bg);
  color: var(--plan-text-primary);
  font-family: var(--plan-font-body);
  font-size: var(--plan-font-size);
  line-height: var(--plan-line-height);
}
```

- [ ] **Step 4: Apply initial theme in main.tsx**

Add before `ReactDOM.createRoot`:
```typescript
import { getInitialTheme, setTheme } from "./lib/theme";
setTheme(getInitialTheme());
```

- [ ] **Step 5: Verify dark mode renders**

Run: `pnpm --filter @planshare/app dev`
Expected: App respects system dark mode preference. Inspect `<html data-theme="dark">`.

- [ ] **Step 6: Commit**

```bash
git add packages/app/src/styles/theme.css packages/app/src/lib/theme.ts packages/app/src/index.css packages/app/src/main.tsx
git commit -m "feat: CSS custom property theme system with dark/light mode"
```

---

### Task 20: Create app shell layout (sidebar + main)

**Files:**
- Create: `packages/app/src/components/layout/Shell.tsx`
- Create: `packages/app/src/components/layout/Sidebar.tsx`
- Create: `packages/app/src/components/layout/ThemeToggle.tsx`
- Modify: `packages/app/src/App.tsx`

- [ ] **Step 1: Create ThemeToggle component**

Create `packages/app/src/components/layout/ThemeToggle.tsx`:
```tsx
import { useState } from "react";
import { toggleTheme, getInitialTheme } from "../../lib/theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState(getInitialTheme);

  return (
    <button
      onClick={() => setThemeState(toggleTheme())}
      className="p-2 rounded-md hover:bg-[var(--plan-bg-hover)] transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
```

- [ ] **Step 2: Create Sidebar component**

Create `packages/app/src/components/layout/Sidebar.tsx`:
```tsx
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link, useParams } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar() {
  const folders = useQuery(api.folders.list, {});
  const me = useQuery(api.users.me, {});
  const { folderSlug } = useParams();

  return (
    <aside
      className="w-[var(--sidebar-width)] bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col h-screen fixed left-0 top-0"
    >
      {/* Logo */}
      <div className="p-4 border-b border-[var(--sidebar-border)]">
        <Link to="/" className="text-[var(--plan-text-heading)] font-semibold text-lg flex items-center gap-2">
          <span className="bg-[var(--plan-accent)] text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold">P</span>
          PlanShare
        </Link>
      </div>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="px-3 py-2 text-[var(--plan-text-muted)] text-xs uppercase tracking-wider">
          Folders
        </div>
        {folders?.map((folder) => (
          <Link
            key={folder._id}
            to={`/f/${folder.slug}`}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              folderSlug === folder.slug
                ? "bg-[var(--plan-bg-hover)] text-[var(--plan-text-heading)]"
                : "text-[var(--plan-text-secondary)] hover:bg-[var(--plan-bg-hover)]"
            }`}
          >
            {folder.name}
          </Link>
        ))}
      </nav>

      {/* User + theme toggle */}
      <div className="p-4 border-t border-[var(--sidebar-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {me?.avatarUrl ? (
            <img src={me.avatarUrl} className="w-7 h-7 rounded-full" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[var(--plan-accent)] flex items-center justify-center text-white text-xs font-semibold">
              {me?.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <div className="text-xs text-[var(--plan-text-heading)]">{me?.name}</div>
            <div className="text-xs text-[var(--plan-text-muted)]">{me?.role}</div>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create Shell layout**

Create `packages/app/src/components/layout/Shell.tsx`:
```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Shell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width)]">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Update App.tsx with routes**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./lib/auth";
import { Shell } from "./components/layout/Shell";

function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-[var(--plan-text-heading)]">
        Welcome to PlanShare
      </h1>
      <p className="text-[var(--plan-text-secondary)] mt-2">
        Select a folder from the sidebar to view plans.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/f/:folderSlug" element={<div>Folder view (coming soon)</div>} />
            <Route path="/f/:folderSlug/:planSlug" element={<div>Plan view (coming soon)</div>} />
            <Route path="/admin/users" element={<div>Admin (coming soon)</div>} />
          </Route>
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Verify shell layout renders**

Run: `pnpm --filter @planshare/app dev`
Expected: Sidebar with logo, folder list (empty), user info, theme toggle. Main content area shows welcome message.

- [ ] **Step 6: Commit**

```bash
git add packages/app/src/components/layout/ packages/app/src/App.tsx
git commit -m "feat: app shell with sidebar, routing, and theme toggle"
```

---

## Chunk 5: Web App — Folder View, Plan View, Version Switcher

### Task 21: Folder view page

**Files:**
- Create: `packages/app/src/pages/FolderView.tsx`
- Create: `packages/app/src/components/plans/StatusBadge.tsx`
- Create: `packages/app/src/components/plans/PlanCard.tsx`

- [ ] **Step 1: Create StatusBadge component**

Create `packages/app/src/components/plans/StatusBadge.tsx`:
```tsx
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[var(--plan-bg-tertiary)] text-[var(--plan-text-muted)]",
  in_review: "bg-blue-500/15 text-[var(--plan-accent)]",
  approved: "bg-green-500/15 text-[var(--plan-success)]",
  rejected: "bg-red-500/15 text-[var(--plan-danger)]",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Changes Requested",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? ""}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
```

- [ ] **Step 2: Create PlanCard component**

Create `packages/app/src/components/plans/PlanCard.tsx`:
```tsx
import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { Doc } from "../../../convex/_generated/dataModel";

interface PlanCardProps {
  plan: Doc<"plans">;
  folderSlug: string;
}

export function PlanCard({ plan, folderSlug }: PlanCardProps) {
  return (
    <Link
      to={`/f/${folderSlug}/${plan.slug}`}
      className={`block bg-[var(--plan-bg-secondary)] border border-[var(--plan-border-subtle)] rounded-lg p-4 hover:border-[var(--plan-border)] transition-colors ${
        plan.status === "draft" ? "opacity-60" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[var(--plan-text-heading)] font-medium">
            {plan.title}
          </h3>
          <p className="text-xs text-[var(--plan-text-muted)] mt-1">
            {new Date(plan.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={plan.status} />
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create FolderView page**

Create `packages/app/src/pages/FolderView.tsx`:
```tsx
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PlanCard } from "../components/plans/PlanCard";

export function FolderView() {
  const { folderSlug } = useParams<{ folderSlug: string }>();
  const folders = useQuery(api.folders.list, {});
  const folder = folders?.find((f) => f.slug === folderSlug);

  const plans = useQuery(
    api.plans.listByFolder,
    folder ? { folderId: folder._id } : "skip"
  );

  if (!folder) {
    return (
      <div className="p-8 text-[var(--plan-text-muted)]">
        Folder not found.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--plan-text-heading)]">
          {folder.name}
        </h1>
        {folder.description && (
          <p className="text-[var(--plan-text-secondary)] mt-1">
            {folder.description}
          </p>
        )}
        <p className="text-sm text-[var(--plan-text-muted)] mt-1">
          {plans?.length ?? 0} plans
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {plans?.map((plan) => (
          <PlanCard key={plan._id} plan={plan} folderSlug={folderSlug!} />
        ))}
        {plans?.length === 0 && (
          <p className="text-[var(--plan-text-muted)] text-sm">
            No plans in this folder yet. Push one with the CLI.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into App.tsx router**

Update the `/f/:folderSlug` route in `App.tsx`:
```tsx
import { FolderView } from "./pages/FolderView";
// ...
<Route path="/f/:folderSlug" element={<FolderView />} />
```

- [ ] **Step 5: Verify folder view renders**

Run: `pnpm --filter @planshare/app dev`
Expected: Navigating to `/f/some-folder` shows the folder view (empty if no data yet).

- [ ] **Step 6: Commit**

```bash
git add packages/app/src/pages/FolderView.tsx packages/app/src/components/plans/ packages/app/src/App.tsx
git commit -m "feat: folder view with plan cards and status badges"
```

---

### Task 22: Plan view page with version switcher

**Files:**
- Create: `packages/app/src/pages/PlanView.tsx`
- Create: `packages/app/src/components/plans/VersionSwitcher.tsx`
- Create: `packages/app/src/components/plans/PlanContent.tsx`

- [ ] **Step 1: Create VersionSwitcher component**

Create `packages/app/src/components/plans/VersionSwitcher.tsx`:
```tsx
import { Doc } from "../../../convex/_generated/dataModel";

interface VersionSwitcherProps {
  versions: Doc<"planVersions">[];
  currentVersionId: string;
  onVersionChange: (versionId: string) => void;
}

export function VersionSwitcher({
  versions,
  currentVersionId,
  onVersionChange,
}: VersionSwitcherProps) {
  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <select
      value={currentVersionId}
      onChange={(e) => onVersionChange(e.target.value)}
      className="bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-md px-2 py-1 text-xs text-[var(--plan-text-primary)]"
    >
      {sorted.map((v) => (
        <option key={v._id} value={v._id}>
          v{v.version}
          {v._id === versions.find((ver) => ver.version === Math.max(...versions.map((x) => x.version)))?._id
            ? " (current)"
            : ""}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Create PlanContent component**

Create `packages/app/src/components/plans/PlanContent.tsx`:
```tsx
interface PlanContentProps {
  htmlContent: string;
}

export function PlanContent({ htmlContent }: PlanContentProps) {
  return (
    <article
      className="plan-content prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
```

**Note:** `dangerouslySetInnerHTML` is acceptable here because the HTML is generated by our own renderer, not user input. The markdown is authored by trusted developers and rendered server-side.

- [ ] **Step 3: Create PlanView page**

Create `packages/app/src/pages/PlanView.tsx`:
```tsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { StatusBadge } from "../components/plans/StatusBadge";
import { VersionSwitcher } from "../components/plans/VersionSwitcher";
import { PlanContent } from "../components/plans/PlanContent";

export function PlanView() {
  const { folderSlug, planSlug } = useParams();
  const plan = useQuery(api.plans.getBySlug, { slug: planSlug! });
  const versions = useQuery(
    api.planVersions.listByPlan,
    plan ? { planId: plan._id } : "skip"
  );

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const currentVersion = versions?.find(
    (v) => v._id === (selectedVersionId ?? plan?.currentVersionId)
  );

  const updateStatus = useMutation(api.plans.updateStatus);

  if (!plan) {
    return <div className="p-8 text-[var(--plan-text-muted)]">Plan not found.</div>;
  }

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 max-w-[var(--plan-content-width)] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--plan-border-subtle)]">
          <Link
            to={`/f/${folderSlug}`}
            className="text-xs text-[var(--plan-accent)] hover:underline"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            {versions && versions.length > 0 && (
              <VersionSwitcher
                versions={versions}
                currentVersionId={selectedVersionId ?? plan.currentVersionId ?? ""}
                onVersionChange={setSelectedVersionId}
              />
            )}
            <StatusBadge status={plan.status} />
            {plan.status === "draft" && (
              <button
                onClick={() =>
                  updateStatus({ planId: plan._id, status: "in_review" })
                }
                className="px-3 py-1 bg-[var(--plan-accent)] text-white text-xs rounded-md hover:opacity-90 transition-opacity"
              >
                Request Review
              </button>
            )}
            {plan.status === "in_review" && (
              <>
                <button
                  onClick={() => {
                    // Will trigger review modal — implemented in Chunk 6
                  }}
                  className="px-3 py-1 bg-[var(--plan-success)] text-white text-xs rounded-md hover:opacity-90"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    // Will trigger review modal — implemented in Chunk 6
                  }}
                  className="px-3 py-1 border border-[var(--plan-danger)] text-[var(--plan-danger)] text-xs rounded-md hover:bg-[var(--plan-danger-bg)]"
                >
                  Request Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Plan content */}
        {currentVersion && (
          <>
            <h1 className="text-2xl font-semibold text-[var(--plan-text-heading)] mb-1">
              {plan.title}
            </h1>
            <p className="text-xs text-[var(--plan-text-muted)] mb-6">
              v{currentVersion.version} · {new Date(currentVersion.pushedAt).toLocaleDateString()}
              {currentVersion.changeNote && ` · ${currentVersion.changeNote}`}
            </p>
            <PlanContent htmlContent={currentVersion.htmlContent} />
          </>
        )}
      </div>

      {/* Right sidebar — will be expanded in Chunk 6 */}
      <div className="w-56 border-l border-[var(--plan-border-subtle)] bg-[var(--plan-bg-secondary)] p-4 hidden lg:block">
        <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-2">
          Versions
        </div>
        {versions?.sort((a, b) => b.version - a.version).map((v) => (
          <button
            key={v._id}
            onClick={() => setSelectedVersionId(v._id)}
            className={`block w-full text-left text-sm px-2 py-1 rounded ${
              v._id === (selectedVersionId ?? plan.currentVersionId)
                ? "text-[var(--plan-accent)]"
                : "text-[var(--plan-text-muted)] hover:text-[var(--plan-text-primary)]"
            }`}
          >
            v{v.version}
            {v._id === plan.currentVersionId ? " — current" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into App.tsx router**

```tsx
import { PlanView } from "./pages/PlanView";
// ...
<Route path="/f/:folderSlug/:planSlug" element={<PlanView />} />
```

- [ ] **Step 5: Commit**

```bash
git add packages/app/src/pages/PlanView.tsx packages/app/src/components/plans/ packages/app/src/App.tsx
git commit -m "feat: plan view with version switcher and status actions"
```

---

## Chunk 6: Web App — Comments, Reviews, Timeline

### Task 23: Paragraph-level comment system

**Files:**
- Create: `packages/app/src/components/comments/CommentAnchor.tsx`
- Create: `packages/app/src/components/comments/CommentThread.tsx`
- Create: `packages/app/src/components/comments/CommentComposer.tsx`
- Modify: `packages/app/src/components/plans/PlanContent.tsx`

- [ ] **Step 1: Create CommentComposer**

Create `packages/app/src/components/comments/CommentComposer.tsx`:
```tsx
import { useState } from "react";

interface CommentComposerProps {
  onSubmit: (body: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export function CommentComposer({ onSubmit, onCancel, placeholder }: CommentComposerProps) {
  const [body, setBody] = useState("");

  return (
    <div className="bg-[var(--plan-comment-bg)] border border-[var(--plan-border)] rounded-lg p-3 mt-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder ?? "Leave a comment..."}
        className="w-full bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md p-2 text-sm text-[var(--plan-text-primary)] resize-none focus:outline-none focus:border-[var(--plan-accent)]"
        rows={3}
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-primary)]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (body.trim()) {
              onSubmit(body.trim());
              setBody("");
            }
          }}
          disabled={!body.trim()}
          className="px-3 py-1 text-xs bg-[var(--plan-accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
        >
          Comment
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CommentThread**

Create `packages/app/src/components/comments/CommentThread.tsx`:
```tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { CommentComposer } from "./CommentComposer";

interface CommentThreadProps {
  comment: Doc<"comments">;
}

export function CommentThread({ comment }: CommentThreadProps) {
  const [showReply, setShowReply] = useState(false);
  const replies = useQuery(api.comments.listReplies, { commentId: comment._id });
  const replyMutation = useMutation(api.comments.reply);
  const resolveMutation = useMutation(api.comments.resolve);

  return (
    <div
      className={`border-l-2 pl-4 my-3 ${
        comment.resolved
          ? "border-[var(--plan-border-subtle)] opacity-60"
          : "border-[var(--plan-comment-border)]"
      }`}
    >
      <div className="text-sm text-[var(--plan-text-primary)]">{comment.body}</div>
      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--plan-text-muted)]">
        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
        <button
          onClick={() => setShowReply(!showReply)}
          className="hover:text-[var(--plan-accent)]"
        >
          Reply
        </button>
        <button
          onClick={() =>
            resolveMutation({
              commentId: comment._id,
              resolved: !comment.resolved,
            })
          }
          className="hover:text-[var(--plan-accent)]"
        >
          {comment.resolved ? "Unresolve" : "Resolve"}
        </button>
      </div>

      {/* Replies */}
      {replies?.map((reply) => (
        <div key={reply._id} className="ml-4 mt-2 pt-2 border-t border-[var(--plan-border-subtle)]">
          <div className="text-sm text-[var(--plan-text-primary)]">{reply.body}</div>
          <div className="text-xs text-[var(--plan-text-muted)] mt-1">
            {new Date(reply.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}

      {showReply && (
        <CommentComposer
          placeholder="Reply..."
          onSubmit={async (body) => {
            await replyMutation({ commentId: comment._id, body });
            setShowReply(false);
          }}
          onCancel={() => setShowReply(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create CommentAnchor — wraps paragraphs with comment triggers**

Create `packages/app/src/components/comments/CommentAnchor.tsx`:
```tsx
import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { CommentComposer } from "./CommentComposer";
import { CommentThread } from "./CommentThread";

interface CommentAnchorProps {
  planId: Id<"plans">;
  versionId: Id<"planVersions">;
  paragraphId: string;
  comments: Doc<"comments">[];
  children: React.ReactNode;
}

export function CommentAnchor({
  planId,
  versionId,
  paragraphId,
  comments,
  children,
}: CommentAnchorProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const createComment = useMutation(api.comments.create);

  const paraComments = comments.filter((c) => c.paragraphId === paragraphId);
  const hasComments = paraComments.length > 0;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Comment trigger button */}
      {(isHovered || hasComments) && (
        <button
          onClick={() => setShowComposer(true)}
          className={`absolute -right-10 top-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-opacity ${
            hasComments
              ? "bg-[var(--plan-accent)] text-white opacity-80"
              : "bg-[var(--plan-bg-tertiary)] text-[var(--plan-text-muted)] opacity-0 group-hover:opacity-80"
          }`}
        >
          {hasComments ? paraComments.length : "💬"}
        </button>
      )}

      {/* Paragraph content */}
      <div
        className={
          hasComments || showComposer
            ? "bg-[var(--plan-comment-highlight)] -mx-4 px-4 py-1 rounded"
            : ""
        }
      >
        {children}
      </div>

      {/* Comment threads */}
      {paraComments.map((comment) => (
        <CommentThread key={comment._id} comment={comment} />
      ))}

      {/* New comment composer */}
      {showComposer && (
        <CommentComposer
          onSubmit={async (body) => {
            await createComment({ planId, versionId, paragraphId, body });
            setShowComposer(false);
          }}
          onCancel={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update PlanContent to inject comment anchors**

Update `packages/app/src/components/plans/PlanContent.tsx`:
```tsx
import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CommentAnchor } from "../comments/CommentAnchor";
import { createPortal } from "react-dom";

interface PlanContentProps {
  htmlContent: string;
  planId: Id<"plans">;
  versionId: Id<"planVersions">;
}

export function PlanContent({ htmlContent, planId, versionId }: PlanContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const comments = useQuery(api.comments.listByVersion, { versionId }) ?? [];

  // Parse HTML and identify commentable paragraphs
  // For Phase 1, render the HTML and overlay comment anchors using data-paragraph-id attributes
  useEffect(() => {
    if (!containerRef.current) return;

    // Find all elements with data-paragraph-id
    const commentables = containerRef.current.querySelectorAll("[data-paragraph-id]");
    commentables.forEach((el) => {
      el.classList.add("relative");
    });
  }, [htmlContent]);

  return (
    <div ref={containerRef}>
      <div
        className="plan-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {/* Comment anchors rendered as overlays — simplified for Phase 1 */}
      {/* Full implementation will use a more sophisticated approach */}
    </div>
  );
}
```

**Note:** The comment overlay approach will need refinement during implementation. The plan provides the component architecture; the exact DOM integration strategy (portal-based overlays vs. React-rendered HTML replacement) should be determined during development based on what works best with the rendered HTML.

- [ ] **Step 5: Commit**

```bash
git add packages/app/src/components/comments/ packages/app/src/components/plans/PlanContent.tsx
git commit -m "feat: paragraph-level comment system with threads and replies"
```

---

### Task 24: Review timeline component

**Files:**
- Create: `packages/app/src/components/timeline/ReviewTimeline.tsx`
- Create: `packages/app/src/components/timeline/TimelineEntry.tsx`

- [ ] **Step 1: Create TimelineEntry**

Create `packages/app/src/components/timeline/TimelineEntry.tsx`:
```tsx
interface TimelineEntryProps {
  type: "approved" | "changes_requested" | "version_pushed" | "created" | "review_requested";
  authorName: string;
  timestamp: number;
  note?: string;
  versionNumber?: number;
}

const TYPE_STYLES: Record<string, { dot: string; label: string }> = {
  approved: { dot: "bg-[var(--plan-success)]", label: "Approved" },
  changes_requested: { dot: "bg-[var(--plan-danger)]", label: "Requested changes" },
  version_pushed: { dot: "bg-[var(--plan-accent)]", label: "Pushed" },
  created: { dot: "bg-[var(--plan-text-muted)]", label: "Created plan" },
  review_requested: { dot: "bg-[var(--plan-accent)]", label: "Requested review" },
};

export function TimelineEntry({ type, authorName, timestamp, note, versionNumber }: TimelineEntryProps) {
  const style = TYPE_STYLES[type];

  return (
    <div className="relative pl-5 pb-4">
      {/* Dot */}
      <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${style.dot}`} />
      {/* Line */}
      <div className="absolute left-[4.5px] top-4 bottom-0 w-px bg-[var(--plan-border-subtle)]" />

      <div className="text-sm">
        <span className="text-[var(--plan-text-heading)] font-medium">{authorName}</span>
        <span className="text-[var(--plan-text-muted)]">
          {" "}{style.label}
          {versionNumber ? ` v${versionNumber}` : ""}
        </span>
      </div>
      {note && (
        <p className="text-xs text-[var(--plan-text-muted)] mt-0.5 italic">"{note}"</p>
      )}
      <div className="text-xs text-[var(--plan-text-muted)] mt-0.5">
        {new Date(timestamp).toLocaleString()}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ReviewTimeline**

Create `packages/app/src/components/timeline/ReviewTimeline.tsx`:
```tsx
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TimelineEntry } from "./TimelineEntry";

interface ReviewTimelineProps {
  planId: Id<"plans">;
  planCreatedAt: number;
  planCreatedByName: string;
}

export function ReviewTimeline({ planId, planCreatedAt, planCreatedByName }: ReviewTimelineProps) {
  const reviews = useQuery(api.reviews.listByPlan, { planId }) ?? [];
  const versions = useQuery(api.planVersions.listByPlan, { planId }) ?? [];

  // Build timeline events from reviews + versions + creation
  type TimelineEvent = {
    type: "approved" | "changes_requested" | "version_pushed" | "created";
    authorName: string;
    timestamp: number;
    note?: string;
    versionNumber?: number;
  };

  const events: TimelineEvent[] = [];

  // Add reviews
  for (const review of reviews) {
    events.push({
      type: review.action,
      authorName: "Reviewer", // Will be enriched with user lookup
      timestamp: review.createdAt,
      note: review.note ?? undefined,
    });
  }

  // Add version pushes
  for (const version of versions) {
    events.push({
      type: "version_pushed",
      authorName: "Author", // Will be enriched
      timestamp: version.pushedAt,
      versionNumber: version.version,
      note: version.changeNote ?? undefined,
    });
  }

  // Add creation
  events.push({
    type: "created",
    authorName: planCreatedByName,
    timestamp: planCreatedAt,
  });

  // Sort newest first
  events.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div>
      <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-3">
        Activity
      </div>
      {events.map((event, i) => (
        <TimelineEntry key={i} {...event} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Wire ReviewTimeline into PlanView right sidebar**

Add to the right sidebar section of `packages/app/src/pages/PlanView.tsx`:
```tsx
import { ReviewTimeline } from "../components/timeline/ReviewTimeline";

// Inside the right sidebar div:
<ReviewTimeline
  planId={plan._id}
  planCreatedAt={plan.createdAt}
  planCreatedByName="Author" // Will be enriched with user data
/>
```

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/components/timeline/ packages/app/src/pages/PlanView.tsx
git commit -m "feat: review timeline with approval, rejection, and version events"
```

---

### Task 25: Review submission (approve / request changes)

**Files:**
- Create: `packages/app/src/components/plans/ReviewModal.tsx`
- Modify: `packages/app/src/pages/PlanView.tsx`

- [ ] **Step 1: Create ReviewModal**

Create `packages/app/src/components/plans/ReviewModal.tsx`:
```tsx
import { useState } from "react";

interface ReviewModalProps {
  action: "approved" | "changes_requested";
  onSubmit: (note: string) => void;
  onClose: () => void;
}

export function ReviewModal({ action, onSubmit, onClose }: ReviewModalProps) {
  const [note, setNote] = useState("");
  const isApproval = action === "approved";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--plan-text-heading)] mb-2">
          {isApproval ? "Approve Plan" : "Request Changes"}
        </h3>
        <p className="text-sm text-[var(--plan-text-secondary)] mb-4">
          {isApproval
            ? "Confirm this plan is ready for implementation."
            : "Describe what needs to change before this can be approved."}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isApproval ? "Optional note..." : "What needs to change?"}
          className="w-full bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-md p-3 text-sm text-[var(--plan-text-primary)] resize-none focus:outline-none focus:border-[var(--plan-accent)]"
          rows={3}
          autoFocus={!isApproval}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(note)}
            className={`px-4 py-2 text-sm text-white rounded-md ${
              isApproval
                ? "bg-[var(--plan-success)] hover:opacity-90"
                : "bg-[var(--plan-danger)] hover:opacity-90"
            }`}
          >
            {isApproval ? "Approve" : "Request Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire ReviewModal into PlanView**

Update `packages/app/src/pages/PlanView.tsx` — add state and handlers:
```tsx
import { ReviewModal } from "../components/plans/ReviewModal";

// Add inside PlanView component:
const [reviewAction, setReviewAction] = useState<"approved" | "changes_requested" | null>(null);
const submitReview = useMutation(api.reviews.submit);

// Replace the Approve/Request Changes button onClick handlers:
// Approve button:
onClick={() => setReviewAction("approved")}
// Request Changes button:
onClick={() => setReviewAction("changes_requested")}

// Add before closing </div> of the component:
{reviewAction && currentVersion && (
  <ReviewModal
    action={reviewAction}
    onSubmit={async (note) => {
      await submitReview({
        planId: plan._id,
        versionId: currentVersion._id,
        action: reviewAction,
        note: note || undefined,
      });
      setReviewAction(null);
    }}
    onClose={() => setReviewAction(null)}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/components/plans/ReviewModal.tsx packages/app/src/pages/PlanView.tsx
git commit -m "feat: review submission modal with approve and request changes"
```

---

### Task 26: Copy-to-Linear button

**Files:**
- Modify: `packages/app/src/pages/PlanView.tsx`

- [ ] **Step 1: Add copy button to right sidebar**

Add to the right sidebar in `PlanView.tsx`:
```tsx
<div className="mt-4 pt-4 border-t border-[var(--plan-border-subtle)]">
  <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-2">
    Actions
  </div>
  <button
    onClick={async () => {
      if (currentVersion) {
        await navigator.clipboard.writeText(currentVersion.markdownContent);
        // TODO: show toast notification
        alert("Copied markdown to clipboard!");
      }
    }}
    className="w-full text-left px-2 py-2 text-sm text-[var(--plan-text-primary)] bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md hover:bg-[var(--plan-bg-hover)] transition-colors"
  >
    📋 Copy for Linear
  </button>
  <button
    onClick={() => {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }}
    className="w-full text-left px-2 py-2 mt-2 text-sm text-[var(--plan-text-primary)] bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md hover:bg-[var(--plan-bg-hover)] transition-colors"
  >
    🔗 Copy Link
  </button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add packages/app/src/pages/PlanView.tsx
git commit -m "feat: copy-to-Linear and copy-link buttons"
```

---

## Chunk 7: CLI — Auth, Commands, Interactive Push

### Task 27: CLI auth (Google OAuth localhost redirect)

**Files:**
- Modify: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/login.ts`
- Create: `packages/cli/src/lib/auth.ts`
- Create: `packages/cli/src/lib/api.ts`

- [ ] **Step 1: Create packages/cli/src/lib/auth.ts**

```typescript
import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".plan-push");
const CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getStoredToken(): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
    return data.token ?? null;
  } catch {
    return null;
  }
}

export function storeToken(token: string) {
  ensureConfigDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ token }, null, 2));
}

export function getConvexUrl(): string {
  // 1. PLANSHARE_URL env var
  if (process.env.PLANSHARE_URL) return process.env.PLANSHARE_URL;

  // 2. .env.local in current directory
  try {
    const envLocal = fs.readFileSync(
      path.join(process.cwd(), ".env.local"),
      "utf-8"
    );
    const match = envLocal.match(/VITE_CONVEX_URL=(.+)/);
    if (match) return match[1].trim();
  } catch {}

  // 3. Stored config
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (config.convexUrl) return config.convexUrl;
  } catch {}

  throw new Error(
    "Could not find Convex URL. Set PLANSHARE_URL env var, or run from a directory with .env.local"
  );
}

export function storeConfig(config: Record<string, string>) {
  ensureConfigDir();
  let existing: Record<string, string> = {};
  try {
    existing = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {}
  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify({ ...existing, ...config }, null, 2)
  );
}
```

- [ ] **Step 2: Create packages/cli/src/lib/api.ts**

```typescript
import { getStoredToken, getConvexUrl } from "./auth";

export async function apiRequest(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  } = {}
) {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated. Run: plan-push login");

  const baseUrl = getConvexUrl();
  const url = new URL(path, baseUrl);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        method: options.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API error (${response.status}): ${errorBody}`);
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message}\nEndpoint: ${url}`
  );
}
```

- [ ] **Step 3: Create packages/cli/src/commands/login.ts**

```typescript
import http from "http";
import open from "open";
import { storeToken, storeConfig } from "../lib/auth";

export async function loginCommand() {
  console.log("Opening browser for Google sign-in...\n");

  // This is a simplified version. In production, this would:
  // 1. Start a local HTTP server on a random port
  // 2. Open Google OAuth consent URL
  // 3. Receive the callback with auth code
  // 4. Exchange code for token via Convex HTTP endpoint
  // 5. Store the Convex session token

  // For now, prompt for manual token entry (to be replaced with full OAuth flow)
  const inquirer = await import("inquirer");
  const { token } = await inquirer.default.prompt([
    {
      type: "input",
      name: "token",
      message: "Paste your auth token (from PlanShare settings):",
    },
  ]);

  storeToken(token);
  console.log("\n✓ Logged in successfully. Token stored at ~/.plan-push/credentials.json");
}
```

**Note:** Full Google OAuth localhost redirect flow is complex. Phase 1 uses a manual token paste from the web app's settings page. The full OAuth device flow can be added in a follow-up.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/lib/ packages/cli/src/commands/login.ts
git commit -m "feat: CLI auth, API client, and config management"
```

---

### Task 28: CLI push command (interactive + flags)

**Files:**
- Create: `packages/cli/src/commands/push.ts`
- Create: `packages/cli/src/commands/folders.ts`
- Create: `packages/cli/src/commands/plans.ts`
- Modify: `packages/cli/src/index.ts`

- [ ] **Step 1: Create packages/cli/src/commands/folders.ts**

```typescript
import { apiRequest } from "../lib/api";

export async function foldersCommand() {
  const folders = await apiRequest("/api/folders");

  if (folders.length === 0) {
    console.log("No folders yet.");
    return;
  }

  console.log("\nFolders:\n");
  for (const folder of folders) {
    console.log(`  ${folder.name} (${folder.slug})`);
  }
  console.log("");
}
```

- [ ] **Step 2: Create packages/cli/src/commands/plans.ts**

```typescript
import { apiRequest } from "../lib/api";

export async function plansCommand(folderSlug: string) {
  // First get folders to find the ID
  const folders = await apiRequest("/api/folders");
  const folder = folders.find((f: any) => f.slug === folderSlug);

  if (!folder) {
    console.error(`Folder not found: ${folderSlug}`);
    process.exit(1);
  }

  const plans = await apiRequest("/api/plans", {
    params: { folderId: folder._id },
  });

  if (plans.length === 0) {
    console.log(`No plans in "${folder.name}".`);
    return;
  }

  console.log(`\nPlans in "${folder.name}":\n`);
  for (const plan of plans) {
    console.log(`  ${plan.title} (${plan.slug}) — ${plan.status}`);
  }
  console.log("");
}
```

- [ ] **Step 3: Create packages/cli/src/commands/push.ts**

```typescript
import fs from "fs";
import { apiRequest } from "../lib/api";
import { renderMarkdown } from "@planshare/renderer";

export async function pushCommand(
  filePath: string,
  options: {
    folder?: string;
    plan?: string;
    title?: string;
    note?: string;
  }
) {
  // Read markdown file
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(filePath, "utf-8");

  // Validate markdown
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (!h1Match) {
    console.warn("Warning: No H1 heading found in markdown. Title will need to be provided.");
  }

  // Render to HTML
  const { html } = await renderMarkdown(markdown);

  // Get folders for selection
  const folders = await apiRequest("/api/folders");

  let folderId: string;
  let planId: string | null = null;
  let title: string;

  if (options.folder && options.title && !options.plan) {
    // Flag mode: new plan
    const folder = folders.find((f: any) => f.slug === options.folder);
    if (!folder) {
      console.error(`Folder not found: ${options.folder}`);
      process.exit(1);
    }
    folderId = folder._id;
    title = options.title;
  } else if (options.plan) {
    // Flag mode: update existing plan
    planId = options.plan;
    folderId = ""; // not needed for update
    title = ""; // not needed for update
  } else {
    // Interactive mode
    const inquirer = await import("inquirer");

    const { action } = await inquirer.default.prompt([
      {
        type: "list",
        name: "action",
        message: "New plan or update existing?",
        choices: ["New plan", "Update existing"],
      },
    ]);

    if (action === "New plan") {
      const { selectedFolder } = await inquirer.default.prompt([
        {
          type: "list",
          name: "selectedFolder",
          message: "Which folder?",
          choices: folders.map((f: any) => ({
            name: f.name,
            value: f._id,
          })),
        },
      ]);
      folderId = selectedFolder;

      const { inputTitle } = await inquirer.default.prompt([
        {
          type: "input",
          name: "inputTitle",
          message: "Plan title:",
          default: h1Match?.[1] ?? "",
        },
      ]);
      title = inputTitle;
    } else {
      // Select folder then plan
      const { selectedFolder } = await inquirer.default.prompt([
        {
          type: "list",
          name: "selectedFolder",
          message: "Which folder?",
          choices: folders.map((f: any) => ({
            name: f.name,
            value: f._id,
          })),
        },
      ]);

      const plans = await apiRequest("/api/plans", {
        params: { folderId: selectedFolder },
      });

      const { selectedPlan } = await inquirer.default.prompt([
        {
          type: "list",
          name: "selectedPlan",
          message: "Which plan?",
          choices: plans.map((p: any) => ({
            name: `${p.title} (${p.status})`,
            value: p._id,
          })),
        },
      ]);

      planId = selectedPlan;
      folderId = selectedFolder;
      title = ""; // not needed for update
    }
  }

  // Get change note for updates
  let changeNote = options.note;
  if (planId && !changeNote) {
    const inquirer = await import("inquirer");
    const { note } = await inquirer.default.prompt([
      {
        type: "input",
        name: "note",
        message: "Change note (optional):",
      },
    ]);
    changeNote = note || undefined;
  }

  // Push
  console.log("\nPushing...");
  const result = await apiRequest("/api/push", {
    method: "POST",
    body: {
      folderId: folderId || undefined,
      planId: planId || undefined,
      title: title || undefined,
      markdownContent: markdown,
      htmlContent: html,
      changeNote,
    },
  });

  console.log(`\n✓ Published → ${result.planId}`);
  console.log(`  Version: ${result.versionId}\n`);
}
```

- [ ] **Step 4: Wire all commands into index.ts**

Replace `packages/cli/src/index.ts`:
```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { foldersCommand } from "./commands/folders";
import { plansCommand } from "./commands/plans";
import { pushCommand } from "./commands/push";

const program = new Command();

program
  .name("plan-push")
  .description("Publish plans to PlanShare")
  .version("0.1.0");

program
  .command("login")
  .description("Sign in to PlanShare")
  .action(loginCommand);

program
  .command("folders")
  .description("List folders")
  .action(foldersCommand);

program
  .command("plans <folder>")
  .description("List plans in a folder")
  .action(plansCommand);

program
  .command("push <file>")
  .description("Push a plan (interactive by default)")
  .option("--folder <slug>", "Target folder slug (for new plans)")
  .option("--plan <id>", "Plan ID to update")
  .option("--title <title>", "Plan title (for new plans)")
  .option("--note <note>", "Change note (for updates)")
  .action(pushCommand);

program.parse();
```

- [ ] **Step 5: Verify CLI commands work**

Run: `pnpm --filter @planshare/cli dev -- --help`
Expected: Shows all commands (login, folders, plans, push).

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/
git commit -m "feat: CLI commands — login, folders, plans, push (interactive + flags)"
```

---

## Chunk 8: Admin, Responsive, Integration Tests, Final Polish

### Task 29: Admin user management page

**Files:**
- Create: `packages/app/src/pages/AdminUsers.tsx`
- Modify: `packages/app/src/App.tsx`

- [ ] **Step 1: Create AdminUsers page**

Create `packages/app/src/pages/AdminUsers.tsx`:
```tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function AdminUsers() {
  const me = useQuery(api.users.me, {});
  const users = useQuery(api.users.list, {});
  const invites = useQuery(api.invites.list, {});
  const createInvite = useMutation(api.invites.create);
  const [email, setEmail] = useState("");

  if (me?.role !== "admin") {
    return (
      <div className="p-8 text-[var(--plan-text-muted)]">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-[var(--plan-text-heading)] mb-6">
        User Management
      </h1>

      {/* Invite form */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-[var(--plan-text-heading)] mb-2">
          Invite User
        </h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-md px-3 py-2 text-sm text-[var(--plan-text-primary)] focus:outline-none focus:border-[var(--plan-accent)]"
          />
          <button
            onClick={async () => {
              if (email.trim()) {
                await createInvite({ email: email.trim() });
                setEmail("");
              }
            }}
            className="px-4 py-2 text-sm bg-[var(--plan-accent)] text-white rounded-md hover:opacity-90"
          >
            Send Invite
          </button>
        </div>
      </div>

      {/* Active users */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-[var(--plan-text-heading)] mb-2">
          Active Users ({users?.length ?? 0})
        </h2>
        <div className="border border-[var(--plan-border)] rounded-lg overflow-hidden">
          {users?.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between px-4 py-3 border-b border-[var(--plan-border-subtle)] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--plan-accent)] flex items-center justify-center text-white text-xs font-semibold">
                  {user.name[0]}
                </div>
                <div>
                  <div className="text-sm text-[var(--plan-text-heading)]">{user.name}</div>
                  <div className="text-xs text-[var(--plan-text-muted)]">{user.email}</div>
                </div>
              </div>
              <span className="text-xs text-[var(--plan-text-muted)] capitalize">
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      <div>
        <h2 className="text-sm font-medium text-[var(--plan-text-heading)] mb-2">
          Pending Invites
        </h2>
        <div className="border border-[var(--plan-border)] rounded-lg overflow-hidden">
          {invites?.filter((i) => !i.acceptedAt).map((invite) => (
            <div
              key={invite._id}
              className="flex items-center justify-between px-4 py-3 border-b border-[var(--plan-border-subtle)] last:border-b-0"
            >
              <span className="text-sm text-[var(--plan-text-primary)]">{invite.email}</span>
              <span className="text-xs text-[var(--plan-text-muted)]">
                Invited {new Date(invite.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {(!invites || invites.filter((i) => !i.acceptedAt).length === 0) && (
            <div className="px-4 py-3 text-sm text-[var(--plan-text-muted)]">
              No pending invites.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into router**

Update `App.tsx`:
```tsx
import { AdminUsers } from "./pages/AdminUsers";
// ...
<Route path="/admin/users" element={<AdminUsers />} />
```

Add admin link to Sidebar:
```tsx
{me?.role === "admin" && (
  <Link
    to="/admin/users"
    className="block px-3 py-2 mt-2 rounded-md text-sm text-[var(--plan-text-secondary)] hover:bg-[var(--plan-bg-hover)] border-t border-[var(--sidebar-border)] pt-3"
  >
    ⚙️ User Management
  </Link>
)}
```

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/pages/AdminUsers.tsx packages/app/src/App.tsx packages/app/src/components/layout/Sidebar.tsx
git commit -m "feat: admin user management page with invite form"
```

---

### Task 30: Responsive layout (mobile sidebar collapse)

**Files:**
- Modify: `packages/app/src/components/layout/Shell.tsx`
- Modify: `packages/app/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add mobile sidebar toggle**

Update `Shell.tsx`:
```tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-50 lg:static lg:block transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-[var(--sidebar-width)]">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-[var(--plan-border-subtle)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-[var(--plan-bg-hover)]"
          >
            ☰
          </button>
          <span className="font-semibold text-[var(--plan-text-heading)]">PlanShare</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add close button to Sidebar for mobile**

Update Sidebar to accept `onClose` prop and add a close button visible only on mobile:
```tsx
// At the top of the sidebar, inside the logo section:
<button
  onClick={onClose}
  className="lg:hidden p-1 rounded hover:bg-[var(--plan-bg-hover)]"
>
  ✕
</button>
```

- [ ] **Step 3: Verify responsive behavior**

Run app, resize browser below `lg` breakpoint (1024px).
Expected: Sidebar hidden, hamburger button visible, clicking it slides sidebar in as overlay.

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/components/layout/
git commit -m "feat: responsive sidebar with mobile collapse and overlay"
```

---

### Task 31: Plan content styles (rendered HTML)

**Files:**
- Create: `packages/app/src/styles/plan-content.css`
- Modify: `packages/app/src/index.css`

- [ ] **Step 1: Create plan-content.css**

```css
/* Plan content rendered HTML styles */
.plan-content {
  font-family: var(--plan-font-body);
  font-size: var(--plan-font-size);
  line-height: var(--plan-line-height);
  color: var(--plan-text-primary);
}

.plan-content .plan-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--plan-text-heading);
  margin-bottom: 0.5rem;
}

.plan-content .plan-section {
  margin-bottom: var(--plan-section-gap);
}

.plan-content .plan-heading {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--plan-text-heading);
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--plan-border-subtle);
}

.plan-content .plan-paragraph {
  margin-bottom: var(--plan-paragraph-gap);
}

.plan-content .plan-code {
  background: var(--plan-code-bg);
  border: 1px solid var(--plan-border-subtle);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  font-family: var(--plan-font-mono);
  font-size: 0.85em;
  margin-bottom: var(--plan-paragraph-gap);
}

.plan-content .plan-code code {
  background: none;
  padding: 0;
  border: none;
}

.plan-content code {
  background: var(--plan-code-bg);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-family: var(--plan-font-mono);
  font-size: 0.85em;
}

.plan-content .plan-list {
  padding-left: 1.5rem;
  margin-bottom: var(--plan-paragraph-gap);
}

.plan-content .plan-list li {
  margin-bottom: 0.25rem;
}

.plan-content .plan-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--plan-paragraph-gap);
  font-size: 0.9em;
}

.plan-content .plan-table th,
.plan-content .plan-table td {
  border: 1px solid var(--plan-border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.plan-content .plan-table th {
  background: var(--plan-bg-secondary);
  font-weight: 600;
  color: var(--plan-text-heading);
}

.plan-content strong {
  color: var(--plan-text-heading);
  font-weight: 600;
}

.plan-content a {
  color: var(--plan-accent);
  text-decoration: none;
}

.plan-content a:hover {
  text-decoration: underline;
}

.plan-content blockquote {
  border-left: 3px solid var(--plan-border);
  padding-left: 1rem;
  color: var(--plan-text-secondary);
  margin: 0 0 var(--plan-paragraph-gap);
}

/* Section-specific styles */
.plan-section--summary {
  background: var(--plan-bg-secondary);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--plan-border-subtle);
}

.plan-section--summary .plan-heading {
  border-bottom: none;
}
```

- [ ] **Step 2: Import in index.css**

Add to `packages/app/src/index.css`:
```css
@import "./styles/plan-content.css";
```

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/styles/plan-content.css packages/app/src/index.css
git commit -m "feat: plan content styles with semantic class support and dark mode"
```

---

### Task 32: End-to-end smoke test

**Files:**
- Create: `packages/app/src/__tests__/smoke.test.tsx`

- [ ] **Step 1: Write smoke test for key components**

Create `packages/app/src/__tests__/smoke.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../components/plans/StatusBadge";
import { CommentComposer } from "../components/comments/CommentComposer";
import { TimelineEntry } from "../components/timeline/TimelineEntry";

describe("StatusBadge", () => {
  it("renders correct label for each status", () => {
    const { rerender } = render(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeDefined();

    rerender(<StatusBadge status="in_review" />);
    expect(screen.getByText("In Review")).toBeDefined();

    rerender(<StatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeDefined();

    rerender(<StatusBadge status="rejected" />);
    expect(screen.getByText("Changes Requested")).toBeDefined();
  });
});

describe("CommentComposer", () => {
  it("renders with placeholder text", () => {
    render(
      <CommentComposer
        onSubmit={() => {}}
        onCancel={() => {}}
        placeholder="Test placeholder"
      />
    );
    expect(screen.getByPlaceholderText("Test placeholder")).toBeDefined();
  });

  it("disables submit when empty", () => {
    render(<CommentComposer onSubmit={() => {}} onCancel={() => {}} />);
    const submitBtn = screen.getByText("Comment");
    expect(submitBtn).toHaveAttribute("disabled");
  });
});

describe("TimelineEntry", () => {
  it("renders approval entry", () => {
    render(
      <TimelineEntry
        type="approved"
        authorName="Alex"
        timestamp={Date.now()}
      />
    );
    expect(screen.getByText("Alex")).toBeDefined();
    expect(screen.getByText(/Approved/)).toBeDefined();
  });

  it("renders version push with version number", () => {
    render(
      <TimelineEntry
        type="version_pushed"
        authorName="Steve"
        timestamp={Date.now()}
        versionNumber={3}
      />
    );
    expect(screen.getByText(/v3/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass across all projects (convex, renderer, app, cli).

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/__tests__/smoke.test.tsx
git commit -m "test: smoke tests for StatusBadge, CommentComposer, TimelineEntry"
```

---

### Task 33: Final verification and deploy

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 2: Build the app**

Run: `pnpm --filter @planshare/app build`
Expected: Vite build succeeds.

- [ ] **Step 3: Push schema to Convex production**

Run: `npx convex deploy`
Expected: Schema and functions deployed.

- [ ] **Step 4: Deploy to Vercel**

Run: `vercel --prod`
Expected: Deployment succeeds, live URL accessible.

- [ ] **Step 5: Push all code to GitHub**

```bash
git push origin main
```

- [ ] **Step 6: Verify live app**

Open the Vercel URL. Expected: Login page renders (Google OAuth if configured, or loading screen).

- [ ] **Step 7: Final commit if any cleanup needed**

```bash
git add -A && git commit -m "chore: final Phase 1 cleanup" || echo "Nothing to commit"
```

---

**Plan complete.** 33 tasks across 8 chunks covering:

1. **Bootstrap** — monorepo, Vite app, CLI, renderer, Convex, Vitest, GitHub, Vercel
2. **Renderer** — markdown → semantic HTML with paragraph IDs and section classes
3. **Convex Backend** — schema, factories, folders, plans, versions, comments, reviews, invites, HTTP endpoints
4. **Web App Auth & Shell** — Google OAuth, theme system, sidebar layout, routing
5. **Folder & Plan Views** — plan cards, plan detail, version switcher
6. **Comments & Reviews** — paragraph commenting, threaded replies, review timeline, approve/reject modal
7. **CLI** — auth, API client, interactive push, folders/plans listing
8. **Polish** — admin page, responsive layout, plan content styles, smoke tests, deploy
