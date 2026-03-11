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

describe("folders", () => {
  beforeEach(resetFactoryCounter);

  it("lists all folders excluding deleted", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);

    await createFolder(t, { name: "Active", createdBy: userId });
    const { folderId: deletedId } = await createFolder(t, {
      name: "Deleted",
      createdBy: userId,
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(deletedId, { deletedAt: Date.now() });
    });

    const folders = await asUser.query(api.folders.list, {});
    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe("Active");
  });

  it("creates a folder with a slug", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);

    const folderId = await asUser.mutation(api.folders.create, {
      name: "Platform Redesign",
    });

    const folder = await t.run(async (ctx) => ctx.db.get(folderId));
    expect(folder?.name).toBe("Platform Redesign");
    expect(folder?.slug).toBe("platform-redesign");
    expect(folder?.createdBy).toBe(userId);
  });

  it("rejects unauthenticated access", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.folders.list, {})).rejects.toThrow();
  });
});
