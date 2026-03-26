# Platform

A Turborepo monorepo for a community platform built with Next.js 15, React 19, and Material UI.

## Structure

```
apps/hrm/        — HRM application (git submodule from HRManager)
apps/web/        — Community website (Next.js)
packages/ui/     — Shared UI components (@platform/ui)
packages/config/ — Shared types and config (@platform/config)
```

## Features

### Community
- **Boards** — Categorized discussion boards with full CRUD, pinned posts, and threaded comments
- **Forums** — Discussion forums with topics and threaded replies
- **Calendar** — Monthly calendar view with event creation, editing, and deletion
- **Themes** — 7 switchable themes (dark, light, cyberpunk, retro, bubblegum, ocean, fantasy)
- **Community Survey** — Feature prioritization survey with admin results dashboard

### Security
- **Authentication** — NextAuth v5 with Google and GitHub OAuth
- **Role-based permissions** — Superuser, admin, and user roles with granular permission overrides
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

428 tests across 60 test suites with accessibility checks (jest-axe).

```bash
npx turbo run test --filter=web           # All tests
npx turbo run test:coverage --filter=web  # With coverage
```

## Deployment

The web app deploys to Vercel. Set the root directory to `apps/web` in your Vercel project settings.

Required environment variables:
- `NEXT_PUBLIC_APP_NAME`
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- `NEXT_PUBLIC_HRM_URL`

## CI/CD

GitHub Actions runs lint, format check, tests, and build on every push to master and pull request.
