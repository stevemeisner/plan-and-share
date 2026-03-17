import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Internal (unauthenticated) version for HTTP endpoints (CLI access)
export const pushInternal = internalMutation({
  args: {
    planId: v.id("plans"),
    markdownContent: v.string(),
    htmlContent: v.string(),
    summary: v.optional(v.string()),
    changeNote: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

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
      pushedBy: args.userId,
      pushedAt: Date.now(),
      changeNote: args.changeNote,
    });

    const updates: Record<string, any> = {
      currentVersionId: versionId,
      updatedAt: Date.now(),
    };

    if (plan.status === "rejected") {
      updates.status = "in_review";
    }

    await ctx.db.patch(args.planId, updates);
    return versionId;
  },
});

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
