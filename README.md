# Platform

A Turborepo monorepo for a community platform built with Next.js, React 19, and Material UI.

## Structure

```
apps/hrm/        — HRM application (git submodule from HRManager)
apps/web/        — Community website (Next.js)
packages/ui/     — Shared UI components (@platform/ui)
packages/config/ — Shared types and config (@platform/config)
```

## Features

- **Boards** — Categorized posts with pinned content
- **Forums** — Discussion forums with topics and threaded replies
- **Calendar** — Monthly calendar view with event management
- **Themes** — 7 switchable themes (dark, light, cyberpunk, retro, bubblegum, ocean, fantasy)
- **Authentication** — NextAuth with Google and GitHub OAuth
- **Community Survey** — Feature prioritization survey with admin results dashboard

## Getting started

```bash
git clone --recurse-submodules <this-repo-url>
npm install --ignore-scripts
cp apps/web/.env.example apps/web/.env.local  # Configure env vars

# Database setup (required for survey feature)
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

203 tests across 36 test suites with accessibility checks (jest-axe).

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
