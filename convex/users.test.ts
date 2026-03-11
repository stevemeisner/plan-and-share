import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";
import {
  resetFactoryCounter,
  createAuthUser,
  createUser,
} from "./test.factories";

describe("users", () => {
  beforeEach(resetFactoryCounter);

  it("lists active users", async () => {
    const t = convexTest(schema, modules);
    const { identity: asAdmin } = await createAuthUser(t, { role: "admin" });
    await createUser(t, { name: "Alice" });
    await createUser(t, { name: "Bob", status: "deactivated" });

    const users = await asAdmin.query(api.users.list, {});
    // includes the admin + Alice (Bob is deactivated)
    const activeNames = users.map((u: any) => u.name);
    expect(activeNames).toContain("Alice");
    expect(activeNames).not.toContain("Bob");
  });
});

describe("invites", () => {
  beforeEach(resetFactoryCounter);

  it("admin can create an invite", async () => {
    const t = convexTest(schema, modules);
    const { identity: asAdmin } = await createAuthUser(t, { role: "admin" });

    const inviteId = await asAdmin.mutation(api.invites.create, {
      email: "newuser@example.com",
    });

    const invite = await t.run(async (ctx) => ctx.db.get(inviteId));
    expect(invite?.email).toBe("newuser@example.com");
  });

  it("non-admin cannot create an invite", async () => {
    const t = convexTest(schema, modules);
    const { identity: asMember } = await createAuthUser(t, { role: "member" });

    await expect(
      asMember.mutation(api.invites.create, { email: "x@example.com" })
    ).rejects.toThrow("Admin access required");
  });
});
