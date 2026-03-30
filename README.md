# Platform

A Turborepo monorepo for a community platform built with Next.js 15, React 19, and Material UI.

**Live:** [vuohiliitto.com](https://vuohiliitto.com) (production) | [Vercel deployment](https://platform-numminenmikkopetteri-6027s-projects.vercel.app)

> This platform is in active production use by a real community, with the custom domain vuohiliitto.com configured on Vercel.

## Structure

```
apps/hrm/        — HRM application (git submodule, standalone showpiece)
apps/web/        — Community platform (Next.js 15)
packages/ui/     — Shared UI components (@platform/ui)
packages/config/ — Shared types and config (@platform/config)
```

## Features

### Community
- **Unified Chat Box** — WoW-inspired tabbed chat on the landing page combining guild chat and private whispers in one box:
  - **Guild tab** — Public IRC-style shoutbox with `<alias> message` format, optimistic updates, and superuser star icons
  - **Whisper tabs** — Private DM conversations in pink WoW whisper style (`To [alias]:` / `[alias] whispers:`) with closable tabs, unread badges, and superuser indicators
  - **`/w alias message`** — Slash command to whisper any user from any tab, with live autocomplete suggestions as you type
  - **Privacy Inbox** — Superuser gets a special locked conversation for data protection inquiries (privacy@vuohiliitto.com)
- **Completed Quests Feed** — Shows recently completed custom quests below the shoutbox (who, what, XP earned)
- **Dev Log** — Live GitHub commit feed with color-coded build status (green/red/pending), 10-minute cache, visible to all visitors
- **Boards** — Categorized discussion boards with full CRUD, pinned posts, and threaded comments
- **Forums** — Discussion forums with topics and threaded replies
- **Calendar** — Monthly calendar view with event creation, editing, and deletion
- **Issue Tracker** — Report and resolve issues; superuser can manage issue status
- **User aliases** — Public display names (callsigns) shown instead of real names, editable from account page
- **Themes** — 8 switchable themes including Epic (WoW-inspired with Cinzel font, textured backgrounds, gold ornamental borders)
- **i18n** — Multilingual support (Finnish, English, Somali, Arabic) via next-intl with cookie-based locale detection, Accept-Language fallback, and RTL support for Arabic
- **Pending user gate** — New users complete the survey, then see a "Waiting for approval" screen until an admin assigns them a role

### Gamification
- **XP System** — Earn XP for platform actions (posting, commenting, creating events, completing surveys, login streaks)
- **10-level progression** — Newcomer through Mythic with XP thresholds and level-up celebrations
- **Achievements** — 31 unlockable achievements across categories (onboarding, content, engagement, streaks, moderation)
- **Quest Log** — Daily, weekly, and special quests with progress tracking and XP rewards
- **Leaderboard** — Top users ranked by XP with current user highlighting
- **XP Toast notifications** — Real-time XP award popups after actions
- **Custom Quests** — Superuser-assigned quests with configurable XP rewards, priority levels, deadlines, and status management (open/in progress/completed)
- **Skill-targeted quests** — Quests can target a development skill; matching users earn double XP on completion

### Feedback System
- **Survey rounds** — Superuser creates survey rounds with optional XP rewards; users take surveys from the feedback page
- **Results dashboard** — Expandable per-round results with bar charts and text response lists
- **Quest integration** — Survey rounds can auto-create CustomQuests for all active users; completing the survey auto-completes the quest and awards XP

### Demo Mode
- **Zero-credential demo** — "Try Demo" button in TopBar for unauthenticated visitors; one-click login as superuser
- **Isolated mock data** — Demo sessions are fully isolated via `sessionId` scoping; real community data is never exposed
- **Comprehensive seed data** — 6 users, 2 boards, 5 posts, 12 comments, 10 shoutbox messages, 2 DM conversations, 6 calendar events, 4 issues, 5 survey responses, 4 custom quests, gamification profiles with XP/achievements/quest progress
- **Auto-cleanup** — Stale demo sessions (>24h) are automatically cascade-deleted
- **Tutorial integration** — Guided tour auto-activates for demo users with fresh state

### Guided Tour
- **Role-based tutorial** — 14-step guided tour with 4 tiers (Getting Started, Community Explorer, Admin Basics, Team Leader)
- **Spotlight overlay** — Highlights target elements with pulsing border and tooltip
- **Progress checklist** — Fixed bottom-right panel showing completion status with XP rewards per step
- **Gamification integration** — Tutorial quests and achievements seeded, XP awarded on step completion
- **Auto-sync** — Detects actions completed before the tutorial existed (alias, survey, issues, shoutbox) and backfills progress

### Admin
- **User management** — Role assignment via approval dropdown (no separate approve button), hierarchy enforcement, permission overrides, survey completion status
- **Developer team** — Users indicate skills via survey and account page; superuser assigns team roles (Master, Coder, Artist, Storyteller, Architect, Scout, Advisor); only one Master allowed
- **Vuohiliitto Dashboard** — XP stats, level distribution with hover tooltips, achievement/quest completion rates (superuser/vuohi only)
- **Quest Board** — Global view of all custom quests with filters, creation form, and status management
- **Achievement & Quest CRUD** — Admin editor for managing gamification content

### Security
- **Authentication** — NextAuth v5 with Google OAuth, GitHub OAuth, and zero-credential demo login
- **Role-based permissions** — Superuser, vuohi, admin, user, and pending roles with 25 granular permission keys and per-user overrides
- **Role hierarchy enforcement** — Users can only modify lower-ranked users and assign lower-ranked roles
- **Content ownership** — Edit actions verify the user is the author; admin routes check role in middleware
- **Pending user approval** — New users get zero permissions until approved by an admin
- **guardedAction** — Server action wrapper enforcing auth, permissions, and rate limiting
- **Rate limiting** — PostgreSQL-based atomic sliding window (30 req/60s per user)
- **Security headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy

### GDPR Compliance
- **Account page** — Profile with editable alias, developer tag badge, development interest toggle, gamification stats
- **Account deletion** — Users can delete their account from `/account`, scrubbing all PII, anonymizing authored content, and replacing sent DMs with `[deleted]`
- **Data export** — Users can download all their data as JSON from `/account` (profile, posts, threads, events, shouts, issues, surveys, DM conversations)
- **Privacy policy** — Full policy at `/privacy` covering data collection, cookies, retention, private messaging, user rights, breach notification, data processing legal bases, demo mode handling, and contact email
- **Soft-delete cleanup** — Weekly cron job purges records deleted more than 30 days ago

### Shared Components
- **DataTable** — Generic sortable, paginated, searchable table with column configuration
- **EmptyState** — Reusable empty state with icon, description, and action button
- **SnackbarProvider** — Context-based notification system with `useSnackbar()` hook
- **ConfirmDeleteDialog** — Reusable delete confirmation dialog
- **Centralized color system** — 48 theme-aware color tokens in `styles.ts`, all components reference centralized tokens

### UX Polish
- **Loading skeletons** — Skeleton loading states for all routes
- **Keyboard shortcuts** — `g+h/b/f/c` for navigation, `?` for help dialog, `/w alias msg` for whispers
- **Welcome page** — Animated landing page with "Try Demo" and "Sign In" for unauthenticated visitors
- **Dev Log** — Live GitHub commit feed on the landing page showing recent changes with relative timestamps and CI build status
- **Level-up celebration** — Confetti and overlay animation on XP level milestones
- **Vuohi promotion celebration** — Special animation when promoted to vuohi role
- **Goat favicon** — Custom SVG goat head icon matching the community identity

## Getting started

```bash
git clone --recurse-submodules <this-repo-url>
npm install --ignore-scripts
cp apps/web/.env.example apps/web/.env.local  # Configure env vars

# Database setup (required for all features)
# Option 1: Local PostgreSQL
# Option 2: Free Neon.tech instance (https://neon.tech)
# Set DATABASE_URL in apps/web/.env.local, then:
cd apps/web && npx prisma migrate dev && cd ../..

npx turbo run dev --filter=web
```

Visit http://localhost:3100

## Development

```bash
npx turbo run dev --filter=web   # Start the web app
npx turbo run test --filter=web  # Run tests
npx turbo run lint --filter=web  # Lint
npx turbo run build --filter=web # Production build
```

## Testing

1117+ tests across 131+ test suites with accessibility checks (jest-axe). Playwright E2E framework configured for critical user journeys.

```bash
npx turbo run test --filter=web           # All unit/integration tests
npx turbo run test:coverage --filter=web  # With coverage
cd apps/web && npm run test:e2e           # Playwright E2E tests
```

## Architecture

### Two apps, two databases

Platform and HRM are **separate applications with separate databases**. They are both portfolio showpieces:

- **Platform** — the production community app with boards, forums, calendar, gamification, user management
- **HRM** — a standalone HR management showpiece (git submodule at `apps/hrm/`)

New features are developed in the HRM repo first, then ported to Platform as needed using the same patterns but fresh code. HRM is never modified from within this repo.

### User access model

1. A new user signs in with Google or GitHub OAuth (or clicks "Try Demo" for a zero-credential demo with isolated mock data)
2. They choose a public alias (callsign) on first login — shown instead of real name everywhere
3. They complete a community survey (required before approval)
4. They get a `"pending"` role with **zero permissions** — shown a "Waiting for approval" screen after completing the survey
5. An admin approves them via `/admin/users` by selecting a role from the dropdown (approval and role assignment in one step)
6. The first user to sign up automatically gets `superuser` role (bootstrap admin)

## Deployment

The web app auto-deploys to Vercel on every push to master. Vercel project settings:
- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js

Required environment variables:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret (`openssl rand -base64 32`)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth credentials (optional)
- `NEXT_PUBLIC_APP_NAME` — App name displayed in UI
- `NEXT_PUBLIC_BASE_URL` — Production URL for OG meta tags (default: `https://vuohiliitto.com`)
- `CRON_SECRET` — Secret for authenticating cron job requests (soft-delete cleanup)
- `NEXT_PUBLIC_DEMO_LOGIN` — Set to `"false"` to hide the demo button (default: enabled)
- `GITHUB_TOKEN` — GitHub personal access token for Dev Log commit feed (optional; increases rate limit from 60 to 5000 req/hour)

## CI/CD

GitHub Actions runs lint, format check, tests, and build on every push to master and pull request.

Git hooks (via Husky):
- **Pre-commit** — lint-staged runs Prettier on staged files
- **Pre-push** — ESLint, Prettier check, and full test suite must pass before code reaches the repository
