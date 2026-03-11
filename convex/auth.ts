import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      if (existingUserId) {
        // Returning user — update profile if needed
        await ctx.db.patch(existingUserId, {
          name: (profile.name as string) ?? undefined,
          avatarUrl: (profile.image as string) ?? undefined,
        });
        return existingUserId;
      }

      // New user — create with our custom schema fields
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: `google|${profile.email}`,
        email: (profile.email as string) ?? "",
        name: (profile.name as string) ?? "Unknown",
        avatarUrl: (profile.image as string) ?? undefined,
        role: "member",
        status: "active",
        createdAt: Date.now(),
      });
      return userId;
    },
  },
});
