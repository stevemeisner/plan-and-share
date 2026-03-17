import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import GithubSlugger from "github-slugger";

// Internal (unauthenticated) versions for HTTP endpoints (CLI access)
export const listByFolderInternal = internalQuery({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .collect();
    return plans.filter((p) => !p.deletedAt);
  },
});

export const createWithVersionInternal = internalMutation({
  args: {
    folderId: v.id("folders"),
    title: v.string(),
    markdownContent: v.string(),
    htmlContent: v.string(),
    summary: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const slugger = new GithubSlugger();
    const slug = slugger.slug(args.title);
    const now = Date.now();

    const planId = await ctx.db.insert("plans", {
      folderId: args.folderId,
      title: args.title,
      slug,
      status: "draft",
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    const versionId = await ctx.db.insert("planVersions", {
      planId,
      version: 1,
      markdownContent: args.markdownContent,
      htmlContent: args.htmlContent,
      summary: args.summary,
      pushedBy: args.userId,
      pushedAt: now,
    });

    await ctx.db.patch(planId, { currentVersionId: versionId });
    return { planId, versionId };
  },
});

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

export const requestReview = mutation({
  args: {
    planId: v.id("plans"),
    reviewerIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.planId, {
      status: "in_review",
      requestedReviewers: args.reviewerIds,
      reviewRequestedAt: Date.now(),
      reviewRequestedBy: userId,
      updatedAt: Date.now(),
    });
  },
});

export const myPendingReviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const inReviewPlans = await ctx.db
      .query("plans")
      .withIndex("by_status", (q) => q.eq("status", "in_review"))
      .collect();

    return inReviewPlans.filter(
      (p) =>
        !p.deletedAt &&
        p.requestedReviewers?.includes(userId)
    );
  },
});

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
