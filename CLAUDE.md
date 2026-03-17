# PlanShare

## Project Overview

Open-source tool for publishing, reviewing, and approving technical plans. Each org deploys their own instance — Convex backend + static Vite frontend hosted anywhere.

## Architecture

- **Backend**: Convex (realtime DB, Google OAuth, HTTP API)
- **Frontend**: React + Vite SPA (`packages/app`) — host anywhere
- **CLI**: `@planshare/cli` on npm (`packages/cli`) — bundled with tsup
- **Renderer**: remark/rehype markdown pipeline (`packages/renderer`)

## Commands

```bash
pnpm install          # install deps
pnpm dev              # start frontend (Vite)
npx convex dev        # start Convex dev server
pnpm test             # run all tests (Vitest, 31 specs)
```

### CLI

```bash
cd packages/cli
pnpm build            # bundle with tsup → dist/index.js
npm version patch --no-git-tag-version && npm publish --access public  # bump + publish
```

CLI commands: `login`, `push`, `folders`, `plans`, `create-folder`. See `packages/cli/README.md` for full docs.

## Key Technical Details

- **Test framework**: Vitest with dual environments (`edge-runtime` for Convex, `jsdom` for React, `node` for renderer)
- **CLI bundling**: tsup bundles `@planshare/renderer` + remark/rehype inline. `commander`, `open`, `inquirer` are external (npm dependencies).
- **CLI auth**: Browser-based device-code flow. Uses `?session=` param (NOT `?code=` — `@convex-dev/auth` intercepts and strips `?code=` from URLs automatically)
- **Token auth**: CLI stores Bearer token at `~/.plan-push/credentials.json`. Backend validates via SHA-256 hash lookup in `apiTokens` table.
- **SPA routing**: `packages/app/vercel.json` has catch-all rewrite to `index.html`. Other hosts need equivalent config.

## Convex Environment Variables

All set on Convex deployments (NOT the frontend host):

- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth
- `SITE_URL` — the `.convex.site` domain
- `WEB_APP_URL` — wherever the frontend is hosted (needed for CLI browser auth)
- `ALLOWED_EMAIL_DOMAINS` — optional, comma-separated domain restriction

Frontend build-time: `VITE_CONVEX_URL` — the `.convex.cloud` URL.

## Deploying

```bash
# Convex (uses deploy keys from .env.local / .env.production.local)
npx convex dev --once                                              # dev
npx convex deploy -y --env-file .env.production.local              # prod

# Frontend: push to main triggers redeploy (if CI configured)
git push origin main
```

Deploy keys are stored in `.env.local` (dev) and `.env.production.local` (prod) as `CONVEX_DEPLOY_KEY`. Both files are gitignored. Generate keys from the Convex dashboard → Settings → Deploy Keys.

## Rules

- **Never guess at root causes.** If uncertain, investigate first — read source code, trace execution, check logs. Only ship fixes when the cause is verified.
- **PlanShare is self-hosted, not a SaaS.** Never reference a specific deployment as "the" deployment. Frame docs as "deploy your own."
- **The frontend is host-agnostic.** Don't hardcode Vercel in docs. It's a static Vite app that runs anywhere.
- **Verify features end-to-end before marking complete.** Trace the actual user click path. Backend + components existing is not "done" — they must be wired up and usable. Ask: "Can a user actually do this right now?"
