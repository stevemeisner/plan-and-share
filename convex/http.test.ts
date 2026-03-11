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

describe("HTTP endpoints (via mutations)", () => {
  beforeEach(resetFactoryCounter);

  // HTTP endpoints are tested via their underlying mutations
  // since convex-test doesn't support HTTP route testing directly.

  it("push creates a new plan via createWithVersion", async () => {
    const t = convexTest(schema, modules);
    const { userId, identity: asUser } = await createAuthUser(t);
    const { folderId } = await createFolder(t, { createdBy: userId });

    const result = await asUser.mutation(api.plans.createWithVersion, {
      folderId,
      title: "CLI Push Test",
      markdownContent: "# Test\n\nPushed from CLI.",
      htmlContent: "<article>Test</article>",
    });

    expect(result.planId).toBeDefined();
    expect(result.versionId).toBeDefined();
  });
});
