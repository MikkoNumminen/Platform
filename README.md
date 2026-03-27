# Platform

A Turborepo monorepo for a community platform built with Next.js 15, React 19, and Material UI.

**Live:** [platform-numminenmikkopetteri-6027s-projects.vercel.app](https://platform-numminenmikkopetteri-6027s-projects.vercel.app)

## Structure

```
apps/hrm/        — HRM application (git submodule, standalone showpiece)
apps/web/        — Community platform (Next.js 15)
packages/ui/     — Shared UI components (@platform/ui)
packages/config/ — Shared types and config (@platform/config)
```

## Features

### Community
- **Shoutbox** — IRC-style live chat on the landing page with `<alias> message` format and optimistic updates
- **Boards** — Categorized discussion boards with full CRUD, pinned posts, and threaded comments
- **Forums** — Discussion forums with topics and threaded replies
- **Calendar** — Monthly calendar view with event creation, editing, and deletion
- **User aliases** — Public display names (callsigns) shown instead of real names in all community areas
- **Themes** — 7 switchable themes (dark, light, cyberpunk, retro, bubblegum, ocean, fantasy)
- **Community Survey** — Feature prioritization survey with admin results dashboard

### Security
- **Authentication** — NextAuth v5 with Google and GitHub OAuth
- **Role-based permissions** — Superuser, admin, user, and pending roles with granular permission overrides
- **Pending user approval** — New users get zero permissions until approved by an admin
- **guardedAction** — Server action wrapper enforcing auth, permissions, and rate limiting
- **Rate limiting** — PostgreSQL-based atomic sliding window (30 req/60s per user)
- **Security headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy

### Shared Components
- **DataTable** — Generic sortable, paginated, searchable table with column configuration
- **EmptyState** — Reusable empty state with icon, description, and action button
- **SnackbarProvider** — Context-based notification system with `useSnackbar()` hook
- **ConfirmDeleteDialog** — Reusable delete confirmation dialog

### UX Polish
- **Loading skeletons** — Skeleton loading states for all routes
- **Keyboard shortcuts** — `g+h/b/f/c` for navigation, `?` for help dialog

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

486 tests across 68 test suites with accessibility checks (jest-axe).

```bash
npx turbo run test --filter=web           # All tests
npx turbo run test:coverage --filter=web  # With coverage
```

## Architecture

### Two apps, two databases

Platform and HRM are **separate applications with separate databases**. They are both portfolio showpieces:

- **Platform** — the production community app with boards, forums, calendar, user management
- **HRM** — a standalone HR management showpiece (git submodule at `apps/hrm/`)

New features are developed in the HRM repo first, then ported to Platform as needed using the same patterns but fresh code. HRM is never modified from within this repo.

### User access model

1. A new user signs in with Google or GitHub OAuth
2. They choose a public alias (callsign) on first login — shown instead of real name everywhere
3. They get a `"pending"` role with **zero permissions** — no access to community content
4. An admin approves them via `/admin/users` and assigns a role (`user`, `admin`, or `superuser`)
5. The first user to sign up automatically gets `superuser` role (bootstrap admin)

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

## CI/CD

GitHub Actions runs lint, format check, tests, and build on every push to master and pull request.
