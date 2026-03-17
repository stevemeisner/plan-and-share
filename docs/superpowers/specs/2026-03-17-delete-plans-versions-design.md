# Delete Plans & Versions

## Context

Users can create plans and push new versions, but there's no way to delete them from the web interface. The plan creator should be able to delete an entire plan or a specific version.

## Behavior

### Delete a Plan

- Soft-delete: sets `deletedAt = Date.now()` on the plan record
- Plan disappears from the folder view (existing queries already filter by `deletedAt`)
- Only the plan creator can delete
- Confirm dialog: "Delete [plan title]? This will hide it from the folder. This can't be undone."

### Delete a Version

- Soft-delete: sets `deletedAt = Date.now()` on the version record (new field)
- If the deleted version is `currentVersionId`, auto-revert to the most recent remaining version
- If it's the last remaining version, soft-delete the entire plan
- Only the plan creator can delete
- Confirm dialog: "Delete version [N]? This can't be undone."

## Data Changes

### Schema

Add `deletedAt` to `planVersions` table:

```typescript
planVersions: defineTable({
  // ...existing fields...
  deletedAt: v.optional(v.number()),
})
```

### New Mutations

**`plans.deletePlan`**
- Args: `planId`
- Validates caller is plan creator (`createdBy`)
- Sets `deletedAt = Date.now()`

**`planVersions.deleteVersion`**
- Args: `versionId`
- Validates caller is creator of the parent plan
- Soft-deletes the version
- If deleted version is `currentVersionId`:
  - Query remaining (non-deleted) versions sorted by version number descending
  - Set `currentVersionId` to the most recent remaining version
- If no versions remain, soft-delete the parent plan

### Query Changes

- `planVersions.listByPlan`: filter out records where `deletedAt` is set
- Internal version queries used by HTTP endpoints: same filter

## UI Changes

### Version List (Right Sidebar)

Each version row gets a small trash icon button, visible on hover:

```
v3 — current        🗑  (hover-visible)
v2                   🗑  (hover-visible)
v1                   🗑  (hover-visible)
```

### Actions Section (Right Sidebar)

Add "Delete Plan" at the bottom of the Actions section, styled as a danger action:

```
Actions
├── Copy for Linear
├── Copy Link
└── Delete Plan        (red text, danger styling)
```

### ConfirmDialog Component

New reusable modal component at `packages/app/src/components/plans/ConfirmDialog.tsx`:

- Props: `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`
- Confirm button styled as danger (red)
- Used for both plan deletion and version deletion

## Files to Change

| File | Change |
|------|--------|
| `convex/schema.ts` | Add `deletedAt` to `planVersions` |
| `convex/plans.ts` | Add `deletePlan` mutation |
| `convex/planVersions.ts` | Add `deleteVersion` mutation, filter deleted in queries |
| `packages/app/src/pages/PlanView.tsx` | Add delete buttons in sidebar, wire up confirm dialogs |
| `packages/app/src/components/plans/ConfirmDialog.tsx` | New reusable confirm modal |

## Authorization

Both mutations check that the authenticated user's ID matches `plan.createdBy`. If not, throw an error.

## Edge Cases

- **Last version deleted**: soft-deletes the parent plan automatically
- **Current version deleted**: falls back to most recent remaining version
- **Plan in review**: deletion is still allowed (creator's prerogative)
- **Comments on deleted version**: orphaned but invisible since the version won't appear in queries
