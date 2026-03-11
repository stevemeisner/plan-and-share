import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

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

    // Resolve email to userId for attribution
    const email = request.headers.get("X-User-Email");
    let userId: string | undefined;
    if (email) {
      const user = await ctx.runQuery(internal.users.getByEmail, { email });
      if (user) {
        userId = user._id;
      }
    }

    let result;
    if (planId) {
      // Update existing plan
      const versionId = await ctx.runMutation(internal.planVersions.pushInternal, {
        planId,
        markdownContent,
        htmlContent,
        changeNote,
        userId: userId as any,
      });
      result = { planId, versionId };
    } else {
      // Create new plan
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
