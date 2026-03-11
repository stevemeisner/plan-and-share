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
