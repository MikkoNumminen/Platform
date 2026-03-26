# Platform

A Turborepo monorepo for a community platform.

## Structure

- `apps/hrm` — HRM application (git submodule from [HRManager](https://github.com/MikkoNumminen/HRManager))
- `apps/web` — Community website
- `packages/` — Shared packages (future)

## Getting started

```bash
git clone --recurse-submodules <this-repo-url>
npm install --ignore-scripts
npx turbo run dev --filter=web
```

## Development

```bash
npx turbo run dev              # Start all apps
npx turbo run dev --filter=web # Start only the web app
npx turbo run build            # Build all apps
```
