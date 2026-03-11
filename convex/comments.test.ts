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

    await createComment(t, {
      versionId,
      planId,
      paragraphId: "p1",
    });
    await createComment(t, {
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
