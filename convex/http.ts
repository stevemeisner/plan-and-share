import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/folders",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const folders = await ctx.runQuery(api.folders.list, {});
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
    const plans = await ctx.runQuery(api.plans.listByFolder, {
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

    let result;
    if (planId) {
      // Update existing plan
      const versionId = await ctx.runMutation(api.planVersions.push, {
        planId,
        markdownContent,
        htmlContent,
        changeNote,
      });
      result = { planId, versionId };
    } else {
      // Create new plan
      result = await ctx.runMutation(api.plans.createWithVersion, {
        folderId,
        title,
        markdownContent,
        htmlContent,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
