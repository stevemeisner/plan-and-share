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
