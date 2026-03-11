import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      const email = profile.email as string;

      // Restrict sign-ups to allowed email domains (comma-separated env var)
      // e.g. ALLOWED_EMAIL_DOMAINS=aktiga.com,example.com
      // @ts-expect-error Convex server runtime provides process.env
      const allowedDomains: string | undefined = process.env.ALLOWED_EMAIL_DOMAINS;
      if (allowedDomains && email) {
        const domains = allowedDomains.split(",").map((d: string) => d.trim().toLowerCase());
        const userDomain = email.split("@")[1]?.toLowerCase();
        if (!domains.includes(userDomain)) {
          throw new Error(
            `Sign-in restricted to ${domains.join(", ")} email addresses.`
          );
        }
      }

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
        tokenIdentifier: `google|${email}`,
        email: email ?? "",
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
