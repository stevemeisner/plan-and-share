import { TestConvex } from "convex-test";
import schema from "./schema";

type TestCtx = TestConvex<typeof schema>;

let counter = 0;
const nextId = () => ++counter;
export const resetFactoryCounter = () => {
  counter = 0;
};

export async function createUser(
  t: TestCtx,
  overrides: {
    email?: string;
    name?: string;
    role?: "admin" | "member";
    status?: "active" | "deactivated";
  } = {}
) {
  const n = nextId();
  const userId = await t.run(async (ctx) => {
    return ctx.db.insert("users", {
      tokenIdentifier: `test-token-${n}`,
      email: overrides.email ?? `testuser${n}@example.com`,
      name: overrides.name ?? `Test User ${n}`,
      role: overrides.role ?? "member",
      status: overrides.status ?? "active",
      createdAt: Date.now(),
    });
  });
  return userId;
}

export async function createAuthUser(
  t: TestCtx,
  overrides: Parameters<typeof createUser>[1] = {}
) {
  const userId = await createUser(t, overrides);
  await t.run(async (ctx) => {
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "google" as any,
      providerAccountId: `google-${userId}`,
    } as any);
  });
  return {
    userId,
    identity: t.withIdentity({ subject: `${userId}|google` }),
  };
}

export async function createFolder(
  t: TestCtx,
  overrides: {
    name?: string;
    slug?: string;
    createdBy?: any;
  } = {}
) {
  const n = nextId();
  const createdBy = overrides.createdBy ?? (await createUser(t));
  const name = overrides.name ?? `Test Folder ${n}`;
  const slug = overrides.slug ?? `test-folder-${n}`;

  const folderId = await t.run(async (ctx) => {
    return ctx.db.insert("folders", {
      name,
      slug,
      createdBy,
      createdAt: Date.now(),
    });
  });
  return { folderId, createdBy };
}

export async function createPlan(
  t: TestCtx,
  overrides: {
    folderId?: any;
    title?: string;
    slug?: string;
    status?: "draft" | "in_review" | "approved" | "rejected";
    createdBy?: any;
  } = {}
) {
  const n = nextId();
  const createdBy = overrides.createdBy ?? (await createUser(t));
  let folderId = overrides.folderId;
  if (!folderId) {
    const folder = await createFolder(t, { createdBy });
    folderId = folder.folderId;
  }

  const now = Date.now();
  const planId = await t.run(async (ctx) => {
    return ctx.db.insert("plans", {
      folderId,
      title: overrides.title ?? `Test Plan ${n}`,
      slug: overrides.slug ?? `test-plan-${n}`,
      status: overrides.status ?? "draft",
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
  });
  return { planId, folderId, createdBy };
}

export async function createPlanVersion(
  t: TestCtx,
  overrides: {
    planId?: any;
    version?: number;
    markdownContent?: string;
    htmlContent?: string;
    pushedBy?: any;
    changeNote?: string;
  } = {}
) {
  const n = nextId();
  let planId = overrides.planId;
  let pushedBy = overrides.pushedBy;

  if (!planId) {
    const plan = await createPlan(t);
    planId = plan.planId;
    pushedBy = pushedBy ?? plan.createdBy;
  }
  if (!pushedBy) {
    pushedBy = await createUser(t);
  }

  const versionId = await t.run(async (ctx) => {
    return ctx.db.insert("planVersions", {
      planId,
      version: overrides.version ?? 1,
      markdownContent: overrides.markdownContent ?? `# Plan ${n}\n\nContent.`,
      htmlContent:
        overrides.htmlContent ?? `<article class="plan-content"><p>Content.</p></article>`,
      pushedBy,
      pushedAt: Date.now(),
      changeNote: overrides.changeNote,
    });
  });

  // Update plan's currentVersionId
  await t.run(async (ctx) => {
    await ctx.db.patch(planId, { currentVersionId: versionId });
  });

  return { versionId, planId, pushedBy };
}

export async function createComment(
  t: TestCtx,
  overrides: {
    planId?: any;
    versionId?: any;
    paragraphId?: string;
    body?: string;
    authorId?: any;
    resolved?: boolean;
  } = {}
) {
  const n = nextId();
  let versionId = overrides.versionId;
  let planId = overrides.planId;
  const authorId = overrides.authorId ?? (await createUser(t));

  if (!versionId) {
    const ver = await createPlanVersion(t);
    versionId = ver.versionId;
    planId = planId ?? ver.planId;
  }

  const commentId = await t.run(async (ctx) => {
    return ctx.db.insert("comments", {
      planId: planId!,
      versionId,
      paragraphId: overrides.paragraphId ?? `section-p${n}`,
      body: overrides.body ?? `Test comment ${n}`,
      authorId,
      resolved: overrides.resolved ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { commentId, planId, versionId, authorId };
}

export async function createInvite(
  t: TestCtx,
  overrides: {
    email?: string;
    invitedBy?: any;
  } = {}
) {
  const n = nextId();
  const invitedBy = overrides.invitedBy ?? (await createUser(t, { role: "admin" }));

  const inviteId = await t.run(async (ctx) => {
    return ctx.db.insert("invites", {
      email: overrides.email ?? `invite${n}@example.com`,
      invitedBy,
      createdAt: Date.now(),
    });
  });

  return { inviteId, invitedBy };
}
