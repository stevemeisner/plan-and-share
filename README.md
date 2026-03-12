# PlanShare

Open-source tool for publishing, reviewing, and approving technical plans. Write plans in markdown, push them with the CLI, and your team reviews in the web app — inline comments, approve/request changes, version tracking.

Each org deploys their own instance: a Convex backend and a static Vite app you can host anywhere. Restrict access to your email domain with `ALLOWED_EMAIL_DOMAINS`.

## How It Works

1. Write a technical plan in markdown
2. Push it to PlanShare with the CLI (`plan-push push ./my-plan.md`)
3. Team reviews in the web app — inline comments, approve/request changes
4. Iterate: push new versions, resolve comments, get approval

## Architecture

```
packages/
  app/        → React SPA (Vite + Tailwind v4)
  renderer/   → Markdown → semantic HTML pipeline (remark/rehype)
  cli/        → CLI tool for pushing plans
convex/       → Backend (Convex — realtime DB, auth, HTTP endpoints)
```

- **Frontend:** React + TypeScript, Convex realtime queries, CSS custom properties for dark/light theming
- **Backend:** Convex with Google OAuth via `@convex-dev/auth`
- **Renderer:** remark/rehype pipeline that produces semantic HTML with stable paragraph IDs for anchoring comments
- **CLI:** Node.js CLI (`plan-push`) using Commander + Inquirer

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- A [Convex](https://convex.dev) account

### Setup

```bash
# Clone and install
git clone https://github.com/stevemeisner/plan-and-share.git
cd plan-and-share
pnpm install

# Start Convex dev server (first run will prompt you to create a project)
npx convex dev

# In a separate terminal, start the frontend
pnpm dev
```

The app runs at `http://localhost:5173`. Convex dev server syncs your functions automatically.

### Environment Variables

Local development needs a `.env.local` in the project root:

```bash
# Created automatically by `npx convex dev` on first run
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

For auth to work, you need these environment variables set on **both** your Convex dev and prod deployments:

```bash
# Dev deployment (used by `npx convex dev`)
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"
npx convex env set SITE_URL "http://localhost:5173"
npx @convex-dev/auth   # generates JWKS and JWT_PRIVATE_KEY

# Prod deployment
npx convex env set AUTH_GOOGLE_ID "your-google-client-id" --prod
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret" --prod
npx convex env set SITE_URL "https://your-deployment.convex.site" --prod
npx @convex-dev/auth --prod

# Optional: restrict sign-in to specific email domains (comma-separated)
npx convex env set ALLOWED_EMAIL_DOMAINS "yourcompany.com"
npx convex env set ALLOWED_EMAIL_DOMAINS "yourcompany.com" --prod
```

If `ALLOWED_EMAIL_DOMAINS` is not set, any Google account can sign in.

### Tests

```bash
pnpm test          # Run all tests (31 across 8 files)
pnpm test:watch    # Watch mode
```

Tests use Vitest with dual environments: `edge-runtime` for Convex backend tests, `jsdom` for React component tests, and `node` for the renderer.

## CLI: `plan-push`

The CLI lets you push markdown plans to PlanShare from your terminal or CI pipeline.

### Install

```bash
# As a dev dependency (recommended for projects)
pnpm add -D @planshare/cli
npx plan-push login https://your-server.convex.site

# Or globally
pnpm add -g @planshare/cli
plan-push login https://your-server.convex.site
```

### Authentication

```bash
plan-push login                                    # interactive
plan-push login https://your-server.convex.site    # direct
```

This opens your browser to PlanShare where you confirm a verification code. Once confirmed, the CLI stores an API token locally. No passwords or emails to type.

**Important:** The URL must be the `.convex.site` domain (HTTP endpoints), not `.convex.cloud` (realtime client).

The CLI resolves the server URL in this order:
1. `PLANSHARE_URL` environment variable
2. `~/.plan-push/config.json` (set by `plan-push login`)

### Commands

#### `plan-push push <file>`

Push a markdown file as a new plan or update an existing one.

**Interactive mode** (default):

```bash
plan-push push ./docs/my-plan.md
```

Walks you through selecting a folder, entering a title, and choosing new vs. update. The plan title defaults to the first `# H1` heading in your markdown.

**Flag mode** (for CI/scripts):

```bash
# Create a new plan
plan-push push ./plan.md --folder my-folder --title "Q1 Auth Redesign"

# Update an existing plan
plan-push push ./plan.md --plan <plan-id> --note "Addressed review feedback"
```

#### `plan-push folders`

List all folders.

```bash
plan-push folders
```

#### `plan-push plans <folder-slug>`

List plans in a folder.

```bash
plan-push plans engineering
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Browser doesn't open during login | Copy the URL from the terminal and open manually |
| "Session expired" during login | Run `plan-push login` again — sessions last 10 minutes |
| Token stopped working | Token may have been revoked. Run `plan-push login` to get a new one |
| `HTTP 500` on login | The server URL might be wrong — must be `.convex.site`, not `.convex.cloud` |
| `Could not reach <url>/api/folders` | Check the URL and make sure Convex is deployed |

### Markdown Format

Plans are standard markdown. The renderer extracts structure from `## h2` headings to create navigable sections:

```markdown
# My Plan Title

## Executive Summary

High-level overview...

## Technical Architecture

Details about the approach...

## Implementation Approach

Step-by-step plan...
```

Known section types get semantic CSS classes: `executive-summary`, `technical-architecture`, `goals-non-goals`, `risks-mitigations`, `implementation-approach`, `test-coverage-plan`, `rollout-migration`, `open-questions`, `background-context`.

## Project Structure

```
convex/
  schema.ts           → Database schema (users, folders, plans, versions, comments, reviews)
  auth.ts             → Google OAuth provider config
  auth.config.ts      → Convex auth domain config
  http.ts             → HTTP endpoints for CLI (/api/folders, /api/plans, /api/push, /api/cli-auth/*)
  cliAuth.ts          → CLI device-code auth flow + API token management
  folders.ts          → Folder queries/mutations
  plans.ts            → Plan CRUD + status transitions
  planVersions.ts     → Version management (auto-increment, status reset)
  comments.ts         → Comments, replies, resolve/unresolve
  reviews.ts          → Approve / request changes (updates plan status)
  users.ts            → User list and current user
  invites.ts          → Admin invite management

packages/app/src/
  main.tsx            → ConvexAuthProvider entry point
  App.tsx             → Routes: /, /f/:folder, /f/:folder/:plan, /admin/users, /cli-auth
  lib/auth.tsx        → AuthGuard + Google sign-in
  lib/theme.ts        → Dark/light theme (localStorage + prefers-color-scheme)
  pages/              → FolderView, PlanView, AdminUsers, CliAuthPage
  components/         → Shell, Sidebar, PlanContent, Comments, Timeline, etc.
  styles/             → CSS custom properties (theme.css, plan-content.css)

packages/renderer/src/
  index.ts            → renderMarkdown() — async remark/rehype pipeline
  plugins/            → semantic-classes (section wrapping), paragraph-ids (stable IDs)

packages/cli/src/
  index.ts            → Commander CLI entry point
  commands/           → login, folders, plans, push
  lib/                → auth (token storage), api (HTTP client with retry)
```

## Deployment

Deploy your own PlanShare instance with a Convex backend and any static host for the frontend.

### 1. Fork & Clone

```bash
git clone https://github.com/your-org/plan-and-share.git
cd plan-and-share
pnpm install
```

### 2. Set Up Convex

Create a free account at [convex.dev](https://convex.dev), then:

```bash
npx convex dev
```

This creates a Convex project and writes `.env.local` with your deployment URL.

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID (Web application)
3. Set **Authorized JavaScript origins:**
   - `https://your-deployment.convex.site` (your Convex HTTP domain)
   - `http://localhost:5173` (for local dev)
4. Set **Authorized redirect URIs:**
   - `https://your-deployment.convex.site/api/auth/callback/google`
   - `http://localhost:5173/api/auth/callback/google`

### 4. Configure Convex Environment

```bash
# Google OAuth credentials
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"

# Must be your .convex.site domain (not .convex.cloud)
npx convex env set SITE_URL "https://your-deployment.convex.site"

# Required for CLI browser auth (wherever you host the frontend)
npx convex env set WEB_APP_URL "https://your-app.example.com"

# Generate auth signing keys
npx @convex-dev/auth

# Optional: restrict sign-in to your org's email domain
npx convex env set ALLOWED_EMAIL_DOMAINS "yourcompany.com"
# Multiple domains: "company.com,partner.com"
```

### 5. Deploy the Frontend

The frontend is a static Vite app (`packages/app`). Host it anywhere — Vercel, Netlify, Cloudflare Pages, or any static host.

Build it with:

```bash
cd packages/app
VITE_CONVEX_URL=https://your-deployment.convex.cloud pnpm build
```

The `dist/` output is a static site. Set `VITE_CONVEX_URL` as a build-time environment variable pointing to your Convex deployment's `.convex.cloud` URL.

### 6. Deploy Convex to Production

```bash
npx convex deploy -y --typecheck=disable
```

Set the same environment variables on your prod deployment:

```bash
npx convex env set AUTH_GOOGLE_ID "..." --prod
npx convex env set AUTH_GOOGLE_SECRET "..." --prod
npx convex env set SITE_URL "https://your-prod-deployment.convex.site" --prod
npx convex env set WEB_APP_URL "https://your-app.example.com" --prod
npx convex env set ALLOWED_EMAIL_DOMAINS "yourcompany.com" --prod
npx @convex-dev/auth --prod
```

### 7. Set Up the CLI for Your Team

Each team member installs the CLI and authenticates:

```bash
pnpm add -D @planshare/cli
npx plan-push login https://your-deployment.convex.site
```

This opens a browser window where they sign in with Google and confirm a verification code. The CLI stores an API token locally.

### Keeping Dev and Prod in Sync

Always deploy to both environments when pushing Convex function changes:

```bash
npx convex deploy -y --typecheck=disable   # prod
npx convex dev --once                       # dev
git push origin main                        # triggers frontend redeploy (if using CI)
```
