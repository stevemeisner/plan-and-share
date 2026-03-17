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
