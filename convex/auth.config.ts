// @ts-expect-error Convex server runtime provides process.env
const siteUrl: string = process.env.CONVEX_SITE_URL;

export default {
  providers: [
    {
      domain: siteUrl,
      applicationID: "convex",
    },
  ],
};
