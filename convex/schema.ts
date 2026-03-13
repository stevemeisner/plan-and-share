import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    invitedBy: v.optional(v.id("users")),
    status: v.union(v.literal("active"), v.literal("deactivated")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  folders: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  plans: defineTable({
    folderId: v.id("folders"),
    title: v.string(),
    slug: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    currentVersionId: v.optional(v.id("planVersions")),
    createdBy: v.optional(v.id("users")),
    requestedReviewers: v.optional(v.array(v.id("users"))),
    reviewRequestedAt: v.optional(v.number()),
    reviewRequestedBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_folder", ["folderId"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  planVersions: defineTable({
    planId: v.id("plans"),
    version: v.number(),
    markdownContent: v.string(),
    htmlContent: v.string(),
    summary: v.optional(v.string()),
    pushedBy: v.optional(v.id("users")),
    pushedAt: v.number(),
    changeNote: v.optional(v.string()),
  }).index("by_plan", ["planId"]),

  comments: defineTable({
    planId: v.id("plans"),
    versionId: v.id("planVersions"),
    paragraphId: v.string(),
    body: v.string(),
    authorId: v.id("users"),
    resolved: v.boolean(),
    resolvedInVersionId: v.optional(v.id("planVersions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_version", ["versionId"])
    .index("by_paragraph", ["versionId", "paragraphId"]),

  commentReplies: defineTable({
    commentId: v.id("comments"),
    body: v.string(),
    authorId: v.id("users"),
    createdAt: v.number(),
  }).index("by_comment", ["commentId"]),

  reviews: defineTable({
    planId: v.id("plans"),
    versionId: v.id("planVersions"),
    action: v.union(v.literal("approved"), v.literal("changes_requested")),
    note: v.optional(v.string()),
    authorId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_version", ["versionId"]),

  invites: defineTable({
    email: v.string(),
    invitedBy: v.id("users"),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  cliAuthSessions: defineTable({
    code: v.string(),
    sessionSecret: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("expired")
    ),
    token: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_sessionSecret", ["sessionSecret"]),

  apiTokens: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    tokenPrefix: v.string(),
    name: v.optional(v.string()),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_userId", ["userId"]),
});
