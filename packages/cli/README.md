# @planshare/cli

CLI for [PlanShare](https://github.com/stevemeisner/plan-and-share) — an open-source tool for publishing, reviewing, and approving technical plans. Write plans in markdown, push them with `plan-push`, and your team reviews them in the web app with inline comments, approvals, and version tracking.

Each org deploys their own PlanShare instance — a Convex backend and a static Vite app you can host anywhere (Vercel, Netlify, Cloudflare Pages, etc.). Access can be restricted to specific email domains via `ALLOWED_EMAIL_DOMAINS`.

## Install

```bash
# Global install (recommended — works across all your projects)
npm install -g @planshare/cli
plan-push --help

# Or as a per-project dev dependency (useful for CI)
npm install -D @planshare/cli
npx plan-push --help
```

## Authentication

```bash
plan-push login https://your-server.convex.site
```

This opens your browser where you sign in with Google and confirm a verification code. Once confirmed, the CLI stores an API token locally at `~/.plan-push/`. No passwords or emails to type.

## Commands

### `plan-push push <file>`

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

### `plan-push folders`

List all folders.

### `plan-push plans <folder-slug>`

List plans in a folder.

## Markdown Format

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

## Deploying PlanShare

PlanShare has two parts: a **Convex backend** (database, auth, API) and a **Vite frontend** (static app, host anywhere). See the [full setup guide](https://github.com/stevemeisner/plan-and-share#deployment).

For CLI browser auth to work, Convex needs to know where your frontend is hosted. Set this as a **Convex environment variable**:

```bash
# Tell Convex where the web app lives (your frontend URL)
npx convex env set WEB_APP_URL "https://your-app.example.com"
npx convex env set WEB_APP_URL "https://your-app.example.com" --prod
```

The CLI talks to your `.convex.site` URL (the backend). The `WEB_APP_URL` variable tells the backend where to redirect users for browser-based login.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Browser doesn't open during login | Copy the URL from the terminal and open manually |
| "Session expired" during login | Run `plan-push login` again — sessions last 10 minutes |
| Token stopped working | Token may have been revoked. Run `plan-push login` to get a new one |
| `Could not reach <url>/api/folders` | Check the URL and make sure Convex is deployed |

## License

MIT
