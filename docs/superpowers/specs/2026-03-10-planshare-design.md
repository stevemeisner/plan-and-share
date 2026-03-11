# PlanShare — Design Specification

> **Status:** Approved
> **Author:** Steve Meisner
> **Date:** 2026-03-10
> **Repo:** plan-and-share

## Executive Summary

PlanShare is a full-stack system for publishing, reviewing, and approving technical plans produced by Claude Code. It connects a local developer workflow (Claude planning session → CLI push) to a hosted web app where stakeholders, PMs, and developers can read, comment on, and approve plans before implementation begins.

The system has four components:
1. **Claude Code Skill** — guides Claude through a planning session and produces structured, audience-aware markdown
2. **Web App** — Vite + React + TypeScript SPA for viewing plans, commenting, and managing approvals
3. **CLI Tool** — Node.js CLI (`plan-push`) for publishing plans from a developer's machine to the web app
4. **Convex Backend** — shared backend providing realtime data, auth, and HTTP endpoints for the CLI

Target audience: a single organization of 10-50 people. No multi-tenancy required.

## Background & Context

Developers using Claude Code for planning sessions produce valuable artifacts — architectural designs, refactoring strategies, feature specs — that currently have no standard way to be shared, reviewed, or approved by non-developers. Plans get lost in Slack threads, stale Google Docs, or local markdown files. There's no structured review workflow, no inline commenting, and no connection to project management tools like Linear.

## Goals & Non-Goals

### Goals
- Produce well-structured, multi-audience plans via a Claude Code skill
- Publish plans to a hosted web app via a CLI tool
- Enable paragraph-level threaded comments with realtime updates
- Support a plan lifecycle: draft → in_review → approved/rejected
- Version plans (push-based, each CLI push creates a new version)
- Organize plans into folders that map to projects
- Copy-to-clipboard for Linear (phase 1), direct Linear API integration (phase 2)
- Google OAuth with invite-only access (admin invites users)
- Responsive design with dark/light mode
- Semantic HTML output with CSS custom properties for theming

### Non-Goals
- Multi-tenancy / org isolation
- In-browser plan editing (plans are always pushed from CLI)
- Text-level highlighting (paragraph-level comments only in v1)
- Homebrew distribution for CLI (npm only in v1)
- Folder-level RBAC (all members have equal access; admins manage users)

## Architecture Overview

### Stack
- **Frontend:** Vite + React + TypeScript (SPA, deployed to Vercel)
- **Backend:** Convex (realtime database, auth, HTTP endpoints)
- **CLI:** Node.js + commander + inquirer (published to npm)
- **Skill:** Claude Code skill file (SKILL.md)
- **Auth:** Google OAuth via Convex auth, invite-only
- **Monorepo:** pnpm workspaces

### Monorepo Layout

```
plan-and-share/
├── packages/
│   ├── app/                    ← Vite + React + TypeScript
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/     Shell, Sidebar, TopBar
│   │   │   │   ├── plans/      PlanView, VersionSwitcher, StatusBadge
│   │   │   │   ├── comments/   CommentThread, ParagraphAnchor, ResolveButton
│   │   │   │   ├── folders/    FolderList, FolderCard
│   │   │   │   ├── admin/      UserManager, InviteForm
│   │   │   │   ├── timeline/   ReviewTimeline, TimelineEntry
│   │   │   │   └── shared/     Button, Modal, Toast, Avatar
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── FolderView.tsx
│   │   │   │   ├── PlanView.tsx
│   │   │   │   ├── AdminUsers.tsx
│   │   │   │   └── Login.tsx
│   │   │   ├── lib/
│   │   │   │   ├── markdown.ts  MD → semantic HTML renderer
│   │   │   │   └── theme.ts    Dark/light mode, CSS vars
│   │   │   └── App.tsx         Router + ConvexProvider + AuthGuard
│   │   ├── public/
│   │   └── vite.config.ts
│   │
│   └── cli/                    ← Node.js CLI (npm publishable)
│       ├── src/
│       │   ├── commands/
│       │   │   ├── login.ts    Google OAuth device flow
│       │   │   ├── folders.ts  List folders
│       │   │   ├── plans.ts    List plans in folder
│       │   │   ├── push.ts     Interactive push (new or update)
│       │   │   ├── new.ts      Create new plan
│       │   │   └── update.ts   Push new version
│       │   ├── lib/
│       │   │   ├── api.ts      Convex HTTP client
│       │   │   ├── auth.ts     Token storage (~/.plan-push)
│       │   │   └── render.ts   Shared MD → HTML (same as app)
│       │   └── index.ts        CLI entry point (commander)
│       ├── package.json        publishable as @yourorg/plan-push
│       └── tsconfig.json
│
├── convex/                     ← Convex backend (shared)
│   ├── schema.ts
│   ├── auth.ts
│   ├── users.ts
│   ├── folders.ts
│   ├── plans.ts
│   ├── planVersions.ts
│   ├── comments.ts
│   ├── invites.ts
│   ├── reviews.ts
│   └── http.ts                 HTTP endpoints for CLI
│
├── skill/                      ← Claude Code skill
│   └── SKILL.md
│
├── package.json                Workspace root (pnpm)
├── pnpm-workspace.yaml
├── .env.local
└── vercel.json
```

### Data Flow

```
Developer runs Claude Code with planning skill
  → Claude conducts planning session (minimal clarifying questions)
  → Claude produces structured markdown with semantic sections
  → Claude tells developer the exact plan-push command to run

Developer runs: plan-push push ./plan.md
  → CLI reads ~/.plan-push/token (or triggers login)
  → CLI renders markdown → semantic HTML
  → Interactive prompts: new or update? which folder? which plan?
  → CLI POSTs to Convex HTTP endpoint
  → Convex creates plan or planVersion record
  → CLI outputs: ✓ Published v2 → https://plans.yourorg.com/features/auth-overhaul

Reviewer opens link in browser
  → Web app loads plan via Convex realtime subscription
  → Reviewer reads plan, leaves paragraph-level comments
  → Comments appear instantly for all connected viewers
  → Reviewer clicks Approve or Request Changes
  → Timeline updates in realtime
  → Author sees feedback, revises locally, pushes new version
```

## Data Model

### Tables

**users**
| Field | Type | Notes |
|-------|------|-------|
| email | string | Google account |
| name | string | |
| avatarUrl | string | |
| role | "admin" \| "member" | |
| invitedBy | Id\<users\> | |
| status | "active" \| "deactivated" | |
| createdAt | number | |

**folders**
| Field | Type | Notes |
|-------|------|-------|
| name | string | |
| slug | string | URL-friendly |
| description | string? | |
| createdBy | Id\<users\> | |
| createdAt | number | |

**plans**
| Field | Type | Notes |
|-------|------|-------|
| folderId | Id\<folders\> | |
| title | string | |
| slug | string | |
| status | "draft" \| "in_review" \| "approved" \| "rejected" \| "superseded" | |
| currentVersionId | Id\<planVersions\> | |
| createdBy | Id\<users\> | |
| createdAt | number | |
| updatedAt | number | |

**planVersions**
| Field | Type | Notes |
|-------|------|-------|
| planId | Id\<plans\> | |
| version | number | 1, 2, 3... |
| markdownContent | string | Raw markdown from CLI |
| htmlContent | string | Rendered HTML with semantic classes |
| summary | string? | Extracted or provided |
| pushedBy | Id\<users\> | |
| pushedAt | number | |
| changeNote | string? | "Addressed feedback on testing section" |

**comments**
| Field | Type | Notes |
|-------|------|-------|
| planId | Id\<plans\> | |
| versionId | Id\<planVersions\> | Pinned to version |
| paragraphId | string | Semantic anchor like "executive-summary-p1" |
| body | string | |
| authorId | Id\<users\> | |
| resolved | boolean | |
| createdAt | number | |
| updatedAt | number | |

**commentReplies**
| Field | Type | Notes |
|-------|------|-------|
| commentId | Id\<comments\> | |
| body | string | |
| authorId | Id\<users\> | |
| createdAt | number | |

**reviews**
| Field | Type | Notes |
|-------|------|-------|
| planId | Id\<plans\> | |
| versionId | Id\<planVersions\> | |
| action | "approved" \| "changes_requested" | |
| note | string? | Optional summary |
| authorId | Id\<users\> | |
| createdAt | number | |

**invites**
| Field | Type | Notes |
|-------|------|-------|
| email | string | |
| invitedBy | Id\<users\> | |
| acceptedAt | number? | |
| createdAt | number | |

### Plan Status State Machine

```
draft → in_review → approved → (copy to Linear)
                  → rejected → (author pushes new version)
                                → in_review (automatically)
```

- Author pushes plan → starts as "draft"
- Author clicks "Request Review" → moves to "in_review"
- Any member can approve or request changes (creates a review record)
- Rejection + new version push auto-moves back to "in_review"

## UI Design

### App Shell
- Left sidebar: folders with plan counts, quick filters (In Review, Approved, Has Comments), user avatar + role
- Main content area: plan list (folder view) or plan detail (plan view)
- Responsive: sidebar collapses to hamburger on mobile/portrait tablet

### Folder View
- Plan cards showing: title, version, author, time, status badge, summary preview, comment counts
- Search bar for filtering plans within a folder
- Drafts shown at reduced opacity

### Plan View
- **Header bar:** breadcrumb to folder, version switcher dropdown, status badge, Approve / Request Changes buttons
- **Content column:** ~780px max-width, comfortable typography, generous line-height
- **Paragraph comments:** hover icon appears next to each paragraph. Click to open comment composer. Active threads shown inline with blue left border highlight.
- **Threaded replies:** each comment can have replies. Reply input at bottom of thread.
- **Right sidebar (desktop):** comment summary (count, unresolved), review timeline, version history, actions (Copy for Linear, Copy Link)
- **Review timeline:** vertical timeline with colored dots — green (approved), red (changes requested), blue (version pushed), gray (created). Shows reviewer name, action, timestamp, optional note.
- **Responsive:** on mobile/portrait tablet, right sidebar content moves below plan content. Review timeline shows at bottom.

### Design Principles
- **Content first:** plan content is the star, UI chrome is minimal
- **Native-feel interactions:** smooth transitions, instant realtime updates, keyboard shortcuts, toast notifications, no page reloads
- **Dark/light mode:** system preference detection + manual toggle via CSS custom properties
- **Responsive:** sidebar collapses, comment panel overlays, content reflows to full-width, touch-friendly targets

## Semantic HTML Rendering & Theming

### Rendering Pipeline

```
Raw Markdown (from CLI)
  → remark/rehype parser
    → Custom plugins:
      1. Add paragraph IDs (stable anchors for comments)
      2. Render Mermaid blocks → inline SVG
      3. Add semantic class names per section type
      4. Wrap sections in commentable containers
    → Semantic HTML string
      → Stored in Convex (planVersions.htmlContent)
        → Served in web app inside <article class="plan-content">
```

### Paragraph ID Strategy
Every commentable block gets a stable ID derived from its heading ancestry and position:
- `executive-summary-p1`, `executive-summary-p2`
- `technical-architecture-p1`, `technical-architecture-d1` (diagrams)

These IDs are what comments attach to via `paragraphId`.

### Semantic Class Names

| Element | Class | Purpose |
|---------|-------|---------|
| Plan wrapper | `.plan-content` | Top-level container |
| Section | `.plan-section` | Wraps heading + content |
| Section variant | `.plan-section--summary`, `--technical`, `--testing` | Per-section styling |
| Heading | `.plan-heading` | All section headings |
| Paragraph | `.plan-paragraph` | Commentable text block |
| Diagram | `.plan-diagram` | Mermaid SVG container |
| Code block | `.plan-code` | Fenced code |
| List | `.plan-list` | Ordered/unordered lists |
| Table | `.plan-table` | Data tables |
| Callout | `.plan-callout`, `.plan-callout--warning` | Highlighted notes |
| Metadata | `.plan-meta` | Author, date, status block |

### CSS Custom Properties

All colors, spacing, and typography are controlled via CSS custom properties on `:root`. A dark theme overrides via `[data-theme="dark"]`. Custom themes are a CSS variable override — no structural changes needed.

Key variable groups:
- **Surface:** `--plan-bg`, `--plan-bg-secondary`, `--plan-bg-hover`
- **Text:** `--plan-text-primary`, `--plan-text-secondary`, `--plan-text-heading`
- **Borders:** `--plan-border`, `--plan-border-subtle`
- **Interactive:** `--plan-accent`, `--plan-success`, `--plan-danger`
- **Comments:** `--plan-comment-bg`, `--plan-comment-highlight`, `--plan-comment-border`
- **Typography:** `--plan-font-body`, `--plan-font-mono`, `--plan-font-size`, `--plan-line-height`
- **Layout:** `--plan-content-width`, `--plan-paragraph-gap`, `--plan-section-gap`

## Claude Skill Design

### Behavior

The skill guides Claude through producing a structured plan. It:

1. **Starts generic** — user gives a loose prompt ("refactor the auth system")
2. **Fast context gather** — reads codebase silently (relevant files, patterns, recent commits)
3. **Produces a big-picture summary** — one paragraph: "here's what I think you're describing"
4. **Asks targeted clarifying questions** — only about gaps it couldn't fill from context. 2-4 questions max, not a long interview.
5. **Delegates to specialized skills when appropriate:**
   - UI/UX work → invokes design skill for wireframes
   - Convex backend → invokes convex-testing for test plan
   - Expo/mobile → invokes relevant expo skill
   - Unknown technical claims → uses web search, never guesses
   - Asks user for confirmation before invoking sub-skills
6. **Produces the full plan** — structured markdown with all relevant sections
7. **Ends with the publish command** — exact `plan-push` CLI command to run

### Plan Document Structure

```markdown
# [Plan Title]

> **Status:** Draft
> **Author:** [name]
> **Date:** [date]
> **Folder:** [target folder]

## Executive Summary
<!-- For PMs/stakeholders. No jargon. What, why, impact. -->

## Background & Context
<!-- What exists, what's broken, prior art. -->

## Goals & Non-Goals
<!-- Explicit scope boundaries. -->

## Technical Architecture
<!-- For developers. Mermaid diagrams, data flow, components. -->

## Implementation Approach
<!-- Step-by-step. Phases, dependencies, ordering. -->

## Test Coverage Plan
<!-- What gets tested, how, coverage targets. -->

## Rollout & Migration
<!-- Feature flags, staged rollout, rollback, monitoring. -->

## Open Questions
<!-- Unresolved decisions needing stakeholder input. -->

## Risks & Mitigations
<!-- What could go wrong, backup plans. -->
```

Sections are optional — included proportional to plan complexity. A small refactor might skip Rollout and Risks.

### Audience Awareness

The skill adjusts language per section:
- Executive Summary → PM/stakeholder language, no jargon, impact-focused
- Technical Architecture → developer language, precise, includes diagrams
- Test Coverage → QA-friendly, specific coverage targets and strategies
- Rollout → ops-friendly, deployment steps, monitoring, rollback procedures

## CLI Tool Design

### Commands

```
plan-push login                          # OAuth flow, stores token to ~/.plan-push/
plan-push folders                        # List folders
plan-push plans <folder>                 # List plans in a folder
plan-push new <file.md> [flags]          # Create new plan
plan-push update <file.md> [flags]       # Push new version to existing plan
plan-push push <file.md>                 # Interactive: walks through everything
```

### Interactive Mode (default)

Running `plan-push push ./plan.md` without flags walks through:
1. Authenticate (or use stored token)
2. "New plan or update existing?" → select
3. "Which folder?" → list + select (or create new)
4. If updating: "Which plan?" → list + select
5. "Title?" → prompt (pre-filled from markdown H1)
6. "Change note?" → prompt (for updates)
7. Confirm and push
8. Output: `✓ Published v2 → https://plans.yourorg.com/features/auth-overhaul`

### Flag Mode (scriptable)

```
plan-push new ./plan.md --folder "platform-redesign" --title "Auth Overhaul"
plan-push update ./plan.md --plan auth-overhaul --note "Addressed v1 feedback"
```

### Auth

- `plan-push login` opens a browser for Google OAuth
- Token stored at `~/.plan-push/credentials.json`
- CLI reads Convex deployment URL from `.env.local` in project root, or `PLANSHARE_URL` env var

## Phased Delivery

### Phase 1: Core Loop
- Convex schema + auth (Google OAuth, invite-only, admin/member roles)
- Web app: login, folder view, plan view with semantic HTML rendering
- CLI: login, push (new + update), folders, plans commands
- Paragraph-level commenting with threaded replies
- Plan status lifecycle (draft → in_review → approved/rejected)
- Review timeline in sidebar (desktop) / below content (mobile)
- Version history with version switcher
- Dark/light mode
- Copy-to-clipboard for Linear

### Phase 2: Skill + Polish
- Claude Code skill (planning session → structured markdown → publish command)
- Skill orchestration (delegate to design/testing/research skills)
- Mermaid diagram rendering in plan HTML
- Keyboard shortcuts
- Toast notifications for realtime events
- Search across all plans

### Phase 3: Linear Integration
- Linear API connection (admin configures API key)
- "Send to Linear" button on approved plans
- Team/project/status/assignee selection from Linear dropdowns
- Created issues linked back to the plan

### Phase 4: Enhanced Commenting
- Text-level highlighting (select arbitrary text to comment)
- Comment resolution tracking across versions
- "Addressed in v3" indicators on old version comments
