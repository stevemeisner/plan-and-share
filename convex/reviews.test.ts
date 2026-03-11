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
