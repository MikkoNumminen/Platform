# Platform — Project Context

## What is this?
A Turborepo monorepo for a community platform. The goal is to build community features (board, forum, threads, calendar, etc.) on top of an existing HRM (Human Resource Manager) application.

## Rules
- **Never mention the community name anywhere in code, docs, or output.** The community name is only known internally and must not appear in any files.
- **This is a portfolio/showcase project** intended to demonstrate professional skills for job applications. It is also used by the community in production. The GitHub repository should be exemplary — clean commits, good documentation, clear PR descriptions, well-structured code. Treat every public-facing aspect (README, commit messages, code quality, project structure) as something a potential employer would review.
- **Always update README.md** when making changes that affect project structure, setup, commands, or features.
- **Maintain TODO.md** as the central task list. When the user asks for todos, refer to this file. Each task is prefixed with 🟣 (Opus — complex/architectural tasks) or 🔵 (Sonnet — straightforward implementation tasks).

## Architecture

### Monorepo structure
```
apps/hrm/      — HRM application (git submodule, NOT our code)
apps/web/      — Community website (Next.js)
packages/      — Shared packages (future)
```

### HRM integration
- HRM lives at https://github.com/MikkoNumminen/HRManager
- It is included as a **git submodule** at `apps/hrm/`
- **Do NOT copy, duplicate, or modify HRM code in this repo** — it stays as its own repository
- HRM is a full Next.js 16 app (React 19, MUI v7, Prisma, NextAuth v5, PostgreSQL + MongoDB)
- HRM has its own Vercel deployment, separate from the web app
- To update HRM to latest: `cd apps/hrm && git pull origin main && cd ../.. && git add apps/hrm && git commit -m "Update HRM submodule"`
- `npm install` requires `--ignore-scripts` because HRM's postinstall (prisma generate) needs database env vars

### Web app (apps/web)
- Next.js with React 19, TypeScript
- Port 3100 (to avoid conflict with HRM's default port 3000)
- This is where all new community features are built

## Key commands
```bash
npm install --ignore-scripts        # Install all workspace deps (skip HRM prisma)
npx turbo run dev --filter=web      # Run only the web app
npx turbo run dev                   # Run all apps
npx turbo run build --dry-run       # Verify Turbo sees all workspaces
```

## Important constraints
- Keep HRM as a **separate repository** — never fork/copy its code here
- Keep the structure **clean and minimal** — no overengineering
- turbo.json uses Turbo v2 `tasks` syntax (not the deprecated `pipeline`)
- Collaborators must clone with `--recurse-submodules` to get HRM

## Planned features (NOT started yet — do not implement without user request)
- [ ] Board system
- [ ] Forum system
- [ ] Thread system
- [ ] Calendar
- [ ] Additional community features TBD
