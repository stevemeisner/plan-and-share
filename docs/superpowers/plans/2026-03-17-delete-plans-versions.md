# Delete Plans & Versions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow plan creators to delete entire plans or individual versions from the web UI.

**Architecture:** Add soft-delete mutations to Convex backend (creator-only authorization), filter deleted versions in queries, and add delete UI to the right sidebar in PlanView with a reusable confirm dialog.

**Tech Stack:** Convex (mutations, schema), React, Tailwind CSS, Vitest (convex-test)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `convex/schema.ts` | Modify | Add `deletedAt` to `planVersions` |
| `convex/plans.ts` | Modify | Add `deletePlan` mutation |
| `convex/planVersions.ts` | Modify | Add `deleteVersion` mutation, filter deleted versions |
| `convex/plans.test.ts` | Modify | Add delete plan tests |
| `convex/planVersions.test.ts` | Create | Delete version tests |
| `packages/app/src/components/plans/ConfirmDialog.tsx` | Create | Reusable confirm modal |
| `packages/app/src/pages/PlanView.tsx` | Modify | Wire up delete buttons and confirm dialogs |

---

## Chunk 1: Backend

### Task 1: Add `deletedAt` to `planVersions` schema

**Files:**
- Modify: `convex/schema.ts:54-63`

- [ ] **Step 1: Add deletedAt field**

In `convex/schema.ts`, add `deletedAt` to the `planVersions` table definition:

```typescript
  planVersions: defineTable({
    planId: v.id("plans"),
    version: v.number(),
    markdownContent: v.string(),
    htmlContent: v.string(),
    summary: v.optional(v.string()),
    pushedBy: v.optional(v.id("users")),
    pushedAt: v.number(),
    changeNote: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
  }).index("by_plan", ["planId"]),
```

- [ ] **Step 2: Verify schema compiles**

Run: `npx convex dev --once --typecheck=disable` (schema migration only, no data change needed since field is optional)

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "schema: add deletedAt to planVersions for soft-delete"
```

---

### Task 2: Add `deletePlan` mutation

**Files:**
- Modify: `convex/plans.ts`
- Modify: `convex/plans.test.ts`

- [ ] **Step 1: Write failing tests for deletePlan**

Add these tests to the end of the `describe("plans")` block in `convex/plans.test.ts`:

```typescript
  it("deletes a plan (soft-delete by creator)", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const { planId } = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "To Delete",
      markdownContent: "# Delete me",
      htmlContent: "<article>Delete me</article>",
    });

    await asUser.mutation(api.plans.deletePlan, { planId });

    const plan = await t.run(async (ctx) => ctx.db.get(planId));
    expect(plan?.deletedAt).toBeDefined();

    // Should not appear in folder listing
    const plans = await asUser.query(api.plans.listByFolder, { folderId });
    expect(plans).toHaveLength(0);
  });

  it("rejects delete by non-creator", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { identity: asOther } = await createAuthUser(t, { email: "other@example.com" });
    const { folderId } = await createFolder(t, { createdBy: userId });

    const { planId } = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "Not Yours",
      markdownContent: "# Nope",
      htmlContent: "<article>Nope</article>",
    });

    await expect(
      asOther.mutation(api.plans.deletePlan, { planId })
    ).rejects.toThrow("Only the plan creator can delete");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: 2 new tests FAIL — `api.plans.deletePlan` does not exist

- [ ] **Step 3: Implement deletePlan mutation**

Add to the bottom of `convex/plans.ts`:

```typescript
export const deletePlan = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.createdBy !== userId) throw new Error("Only the plan creator can delete");

    await ctx.db.patch(args.planId, { deletedAt: Date.now() });
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add convex/plans.ts convex/plans.test.ts
git commit -m "feat: add deletePlan mutation with creator authorization"
```

---

### Task 3: Add `deleteVersion` mutation

**Files:**
- Modify: `convex/planVersions.ts`
- Create: `convex/planVersions.test.ts`

- [ ] **Step 1: Write failing tests for deleteVersion**

Create `convex/planVersions.test.ts`:

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

describe("planVersions.deleteVersion", () => {
  beforeEach(resetFactoryCounter);

  it("soft-deletes a version and falls back to previous", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const { planId, versionId: v1Id } = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "Multi Version",
      markdownContent: "# V1",
      htmlContent: "<article>V1</article>",
    });

    const v2Id = await asUser.mutation(api.planVersions.push, {
      planId,
      markdownContent: "# V2",
      htmlContent: "<article>V2</article>",
    });

    // Delete v2 (current version)
    await asUser.mutation(api.planVersions.deleteVersion, { versionId: v2Id });

    // v2 should be soft-deleted
    const v2 = await t.run(async (ctx) => ctx.db.get(v2Id));
    expect(v2?.deletedAt).toBeDefined();

    // Plan should fall back to v1
    const plan = await t.run(async (ctx) => ctx.db.get(planId));
    expect(plan?.currentVersionId).toBe(v1Id);
  });

  it("soft-deletes the plan when last version is deleted", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const { planId, versionId } = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "Single Version",
      markdownContent: "# Only",
      htmlContent: "<article>Only</article>",
    });

    await asUser.mutation(api.planVersions.deleteVersion, { versionId });

    const plan = await t.run(async (ctx) => ctx.db.get(planId));
    expect(plan?.deletedAt).toBeDefined();
  });

  it("rejects delete by non-creator", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { identity: asOther } = await createAuthUser(t, { email: "other@example.com" });
    const { folderId } = await createFolder(t, { createdBy: userId });

    const { versionId } = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "Not Yours",
      markdownContent: "# Nope",
      htmlContent: "<article>Nope</article>",
    });

    await expect(
      asOther.mutation(api.planVersions.deleteVersion, { versionId })
    ).rejects.toThrow("Only the plan creator can delete");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: 3 new tests FAIL — `api.planVersions.deleteVersion` does not exist

- [ ] **Step 3: Implement deleteVersion mutation**

Add to the bottom of `convex/planVersions.ts`:

```typescript
export const deleteVersion = mutation({
  args: { versionId: v.id("planVersions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");

    const plan = await ctx.db.get(version.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.createdBy !== userId) throw new Error("Only the plan creator can delete");

    // Soft-delete the version
    await ctx.db.patch(args.versionId, { deletedAt: Date.now() });

    // Find remaining (non-deleted) versions
    const allVersions = await ctx.db
      .query("planVersions")
      .withIndex("by_plan", (q) => q.eq("planId", version.planId))
      .collect();
    const remaining = allVersions.filter((v) => !v.deletedAt);

    if (remaining.length === 0) {
      // Last version deleted — soft-delete the plan
      await ctx.db.patch(version.planId, { deletedAt: Date.now() });
    } else if (plan.currentVersionId === args.versionId) {
      // Deleted the current version — fall back to most recent remaining
      const sorted = remaining.sort((a, b) => b.version - a.version);
      await ctx.db.patch(version.planId, { currentVersionId: sorted[0]._id });
    }
  },
});
```

- [ ] **Step 4: Filter deleted versions in listByPlan query**

In `convex/planVersions.ts`, update the `listByPlan` query handler (line 56-59) to filter deleted versions:

```typescript
export const listByPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const versions = await ctx.db
      .query("planVersions")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    return versions.filter((v) => !v.deletedAt);
  },
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add convex/planVersions.ts convex/planVersions.test.ts
git commit -m "feat: add deleteVersion mutation with fallback and last-version handling"
```

---

## Chunk 2: Frontend

### Task 4: Create ConfirmDialog component

**Files:**
- Create: `packages/app/src/components/plans/ConfirmDialog.tsx`

- [ ] **Step 1: Create the component**

Create `packages/app/src/components/plans/ConfirmDialog.tsx`:

```tsx
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--plan-text-heading)] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[var(--plan-text-secondary)] mb-4">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white rounded-md bg-[var(--plan-danger)] hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

This follows the same modal pattern as `ReviewModal.tsx` — backdrop with `fixed inset-0`, centered card, cancel/confirm buttons.

- [ ] **Step 2: Commit**

```bash
git add packages/app/src/components/plans/ConfirmDialog.tsx
git commit -m "feat: add reusable ConfirmDialog component"
```

---

### Task 5: Wire up delete UI in PlanView

**Files:**
- Modify: `packages/app/src/pages/PlanView.tsx`

- [ ] **Step 1: Add imports and state**

At the top of `PlanView.tsx`, add the import:

```typescript
import { ConfirmDialog } from "../components/plans/ConfirmDialog";
```

Inside the `PlanView` component, after the existing `useState` declarations (around line 36), add:

```typescript
const [confirmDelete, setConfirmDelete] = useState<{ type: "plan" | "version"; versionId?: string } | null>(null);
```

Add the mutations after the existing `submitReview` declaration (around line 49):

```typescript
const deletePlan = useMutation(api.plans.deletePlan);
const deleteVersion = useMutation(api.planVersions.deleteVersion);
```

- [ ] **Step 2: Add delete button to each version row**

In `PlanView.tsx`, replace the version list mapping (lines 146-158) with:

```tsx
{versions?.sort((a, b) => b.version - a.version).map((v) => (
  <div
    key={v._id}
    className="group flex items-center"
  >
    <button
      onClick={() => setSelectedVersionId(v._id)}
      className={`flex-1 text-left text-sm px-2 py-1 rounded ${
        v._id === (selectedVersionId ?? plan.currentVersionId)
          ? "text-[var(--plan-accent)]"
          : "text-[var(--plan-text-muted)] hover:text-[var(--plan-text-primary)]"
      }`}
    >
      v{v.version}
      {v._id === plan.currentVersionId ? " — current" : ""}
    </button>
    {(plan as any).createdBy === me?._id && (
      <button
        onClick={() => setConfirmDelete({ type: "version", versionId: v._id })}
        className="p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--plan-text-muted)] hover:text-[var(--plan-danger)] transition-opacity"
        aria-label={`Delete version ${v.version}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A1.75 1.75 0 0 0 9.25 1.5h-2.5A1.75 1.75 0 0 0 5 3.25Zm2.5-.75a.25.25 0 0 0-.25.25V4h1.5v-.75a.25.25 0 0 0-.25-.25h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
        </svg>
      </button>
    )}
  </div>
))}
```

- [ ] **Step 3: Add "Delete Plan" button to Actions section**

After the "Copy Link" button (around line 193), add the delete plan button (only visible to plan creator):

```tsx
{(plan as any).createdBy === me?._id && (
  <button
    onClick={() => setConfirmDelete({ type: "plan" })}
    className="w-full text-left px-2 py-2 mt-2 text-sm text-[var(--plan-danger)] bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md hover:bg-[var(--plan-danger-bg)] transition-colors cursor-pointer"
  >
    Delete Plan
  </button>
)}
```

- [ ] **Step 4: Add ConfirmDialog rendering**

Before the closing `</div>` of the root flex container (line 245), add:

```tsx
{confirmDelete && (
  <ConfirmDialog
    title={confirmDelete.type === "plan" ? "Delete Plan" : "Delete Version"}
    message={
      confirmDelete.type === "plan"
        ? `Delete "${plan.title}"? This will hide it from the folder. This can't be undone.`
        : `Delete this version? ${versions && versions.length <= 1 ? "This is the only version — the entire plan will be deleted." : "This can't be undone."}`
    }
    confirmLabel="Delete"
    onConfirm={async () => {
      if (confirmDelete.type === "plan") {
        await deletePlan({ planId: plan._id as any });
        setConfirmDelete(null);
        window.history.back();
      } else if (confirmDelete.versionId) {
        const isLastVersion = versions && versions.length <= 1;
        await deleteVersion({ versionId: confirmDelete.versionId as any });
        setConfirmDelete(null);
        if (isLastVersion) {
          window.history.back();
        }
      }
    }}
    onCancel={() => setConfirmDelete(null)}
  />
)}
```

- [ ] **Step 5: Verify it builds**

Run: `pnpm dev` (start the dev server, check for TypeScript/build errors)

- [ ] **Step 6: Commit**

```bash
git add packages/app/src/pages/PlanView.tsx
git commit -m "feat: add delete plan and delete version UI with confirm dialog"
```

---

### Task 6: Deploy and verify

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Deploy to dev**

Run: `npx convex dev --once`

- [ ] **Step 3: Manual verification**

Test in the browser:
1. Open a plan you created with multiple versions
2. Hover a version row — trash icon appears on the right
3. Click trash icon — confirm dialog appears
4. Cancel — dialog closes, nothing deleted
5. Confirm — version disappears from list, plan falls back to previous version
6. Click "Delete Plan" in Actions — confirm dialog appears
7. Confirm — redirected back to folder, plan gone from list
8. Verify a non-creator does NOT see delete buttons

- [ ] **Step 4: Deploy to prod**

Run: `npx convex deploy -y --env-file .env.production.local`

- [ ] **Step 5: Commit any final adjustments and push**

```bash
git push origin main
```
