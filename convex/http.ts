import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { hashToken } from "./cliAuth";

const http = httpRouter();

auth.addHttpRoutes(http);

// --- Helper: resolve userId from Bearer token or email header ---

async function resolveUserId(
  ctx: { runQuery: any },
  request: Request
): Promise<string | undefined> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const tokenH = hashToken(token);
    const result = await ctx.runQuery(internal.cliAuth.validateToken, {
      tokenHash: tokenH,
    });
    if (result) {
      return result.userId;
    }
  }

  // Fall back to email header (backward compat)
  const email = request.headers.get("X-User-Email");
  if (email) {
    const user = await ctx.runQuery(internal.users.getByEmail, { email });
    if (user) {
      return user._id;
    }
  }

  return undefined;
}

// --- Config endpoint ---

http.route({
  path: "/api/config",
  method: "GET",
  handler: httpAction(async () => {
    // @ts-expect-error Convex server runtime provides process.env
    const webAppUrl = process.env.WEB_APP_URL ?? "";
    return new Response(JSON.stringify({ webAppUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// --- CLI auth endpoints ---

http.route({
  path: "/api/cli-auth/start",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { code, sessionSecret } = body;

    if (!code || !sessionSecret) {
      return new Response(
        JSON.stringify({ error: "code and sessionSecret required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sessionId = await ctx.runMutation(internal.cliAuth.startSession, {
      code,
      sessionSecret,
    });

    return new Response(JSON.stringify({ sessionId }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/cli-auth/poll",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const sessionSecret = url.searchParams.get("sessionSecret");

    if (!sessionSecret) {
      return new Response(
        JSON.stringify({ error: "sessionSecret required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await ctx.runQuery(internal.cliAuth.pollSession, {
      sessionSecret,
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// --- Existing endpoints ---

http.route({
  path: "/api/folders",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const folders = await ctx.runQuery(internal.folders.listInternal, {});
    return new Response(JSON.stringify(folders), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/folders",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "name required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = await resolveUserId(ctx, request);

    const result = await ctx.runMutation(internal.folders.createInternal, {
      name,
      description,
      userId: userId as any,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/plans",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const folderId = url.searchParams.get("folderId");
    if (!folderId) {
      return new Response(JSON.stringify({ error: "folderId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const plans = await ctx.runQuery(internal.plans.listByFolderInternal, {
      folderId: folderId as any,
    });
    return new Response(JSON.stringify(plans), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/push",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { folderId, planId, title, markdownContent, htmlContent, changeNote } =
      body;

    const userId = await resolveUserId(ctx, request);

    let result;
    if (planId) {
      const versionId = await ctx.runMutation(
        internal.planVersions.pushInternal,
        {
          planId,
          markdownContent,
          htmlContent,
          changeNote,
          userId: userId as any,
        }
      );
      result = { planId, versionId };
    } else {
      result = await ctx.runMutation(internal.plans.createWithVersionInternal, {
        folderId,
        title,
        markdownContent,
        htmlContent,
        userId: userId as any,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
