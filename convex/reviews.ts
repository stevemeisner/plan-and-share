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
      requestedReviewers: undefined,
      updatedAt: Date.now(),
    });

    return reviewId;
  },
});
