# Platform — Project Context

## What is this?
A Turborepo monorepo for a community platform. The goal is to build community features (board, forum, threads, calendar, etc.) on top of an existing HRM (Human Resource Manager) application.

## Rules
- **Never mention the community name anywhere in code, docs, or output.** The community name is only known internally and must not appear in any files.
- **This is a portfolio/showcase project** intended to demonstrate professional skills for job applications. It is also used by the community in production. The GitHub repository should be exemplary — clean commits, good documentation, clear PR descriptions, well-structured code. Treat every public-facing aspect (README, commit messages, code quality, project structure) as something a potential employer would review.
- **Always update README.md** when making changes that affect project structure, setup, commands, or features.
- **Maintain TODO.md** as the central task list. When the user asks for todos, refer to this file. Each task is prefixed with 🟣 (Opus — complex/architectural tasks) or 🔵 (Sonnet — straightforward implementation tasks). **Every task MUST have a 🟣 or 🔵 prefix — no exceptions.**
- **When the user says "todo" or "todos":** Show the FULL task list from TODO.md. Show the claim name (e.g. "— Claude 3") for every task. All Claude instances must present the list in the same format.
- **Remove completed tasks from TODO.md.** When a task is marked `[x]`, remove it from the file entirely. The user only wants to see undone tasks. Do not keep completed tasks in the list.
- **Never add Co-Authored-By or any Claude/AI attribution to commit messages.** Keep commits clean.
- **Always use conventional commit messages.** Format: `type(scope): description`. Types: feat, fix, chore, docs, refactor, test, ci, style, perf, build.
- **100% test coverage.** Every feature, component, and function must have tests. No exceptions.
- **Small, focused commits.** Break work into small logical commits. Use your judgement on granularity. Before pushing, present the commit message and a summary of changes to the user and wait for approval. Never push without explicit user confirmation.
- **CRITICAL: TODO.md is the coordination protocol. Three mandatory steps:**
  1. **BEFORE starting ANY work:** Update TODO.md — claim the task with your instance name (e.g. "— Claude 3") or create a new task and claim it. Do NOT write a single line of code before this is done.
  2. **AFTER finishing a task:** Immediately mark it `[x]` in TODO.md. Do not batch — mark each task done as soon as it's complete.
  3. **Check for conflicts:** Before claiming a task, read TODO.md to see if another Claude instance already claimed it. Never work on another instance's task.
  This is a hard requirement, not optional. No exceptions. This lets multiple Claude instances coordinate without stepping on each other.

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

### Architecture decision: Separate databases, Platform-native admin
- **HRM and Platform use SEPARATE databases.** They do NOT share user data.
- HRM is a standalone portfolio showpiece. Platform is the production community app.
- Platform has its own user management built into `/admin/users` — it does NOT delegate to HRM.
- New HRM features are developed in the HRM repo first, then ported to Platform as needed (same patterns, fresh code — not copy-paste).
- New users who sign into Platform get a `"pending"` role with zero permissions. An admin must approve them before they can access community content (boards, forums, calendar).
- The first user to sign up automatically gets `"superuser"` role (bootstrap admin).

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

## Deployment
- **Vercel** is the deployment target for `apps/web`
- HRM has its own separate Vercel deployment (connected directly to the HRM repo)
- When configuring Vercel for the web app, set the root directory to `apps/web`

## Important constraints
- Keep HRM as a **separate repository** — never fork/copy its code here
- Keep the structure **clean and minimal** — no overengineering
- turbo.json uses Turbo v2 `tasks` syntax (not the deprecated `pipeline`)
- Collaborators must clone with `--recurse-submodules` to get HRM

## Multi-agent coordination

### Token economy rules (IMPORTANT)
- Default mode is SINGLE AGENT. Do not spawn subagents or teams unless the task clearly benefits from parallelism.
- Before spawning agents, ask yourself: "Can I do this alone in one session?" If yes, do it alone.
- Maximum 2 agents at a time unless user explicitly requests more.
- Use Haiku for read-only tasks (exploration, grep, file search). Use Sonnet for implementation. Use Opus only when user says "ultrathink" or the task involves complex architecture.
- Never spawn a tester agent in parallel with frontend/backend — wait until implementation is done, then test sequentially.
- If a task touches fewer than 5 files, do NOT use agents. Just do it.

### When to use agents:
- Task spans 3+ unrelated domains (frontend + backend + tests)
- Task involves 10+ files across different directories
- User explicitly asks for parallel work or says VUOHITIIMI

### When NOT to use agents:
- Bug fixes
- Single feature in one domain
- Documentation updates
- Small refactors
- Anything you can finish in under 5 minutes

## Model usage
- Default model is Opus
- At the start of every task, ask: "Use Opus or switch to Sonnet to save tokens?"
- Use Sonnet for: simple bug fixes, formatting, documentation, file renaming, small edits under 5 files
- Use Opus for: new features, refactoring, architecture decisions, debugging, code review, multi-file changes
- Use Haiku subagents for all file exploration, grep, and codebase search

## Output style
All instances use explanatory mode. Run `/output-style explanatory` at session start.

## Planned features (NOT started yet — do not implement without user request)
- [ ] Admin user management page (`/admin/users`)
- [ ] Pending user approval flow (new users have no access until approved)
- [ ] Port HRM features to Platform as needed (departments, leave, etc.)
- [ ] Additional community features TBD

## Code Standards

These standards are mandatory for all changes. They were established after a production readiness audit on 2026-04-03.

### Writing code
- All code must be self-documenting. If you need a comment to explain WHAT code does, rename things until you don't. Comments explain WHY only.
- No file over 200 lines. No function over 30 lines. Split by responsibility when exceeded.
- Zero `any` types in production code (test files are exempt). Zero magic numbers. Zero commented-out code.
- Every new function needs a clear name: `get`/`fetch` for data retrieval, `handle` for event handlers, `is`/`has`/`can` for booleans, `format`/`parse` for transforms.
- Before creating a new utility or type, check if one already exists. Shared types go in the source module (e.g. `DmUser` exported from `dm-queries.ts`).
- Prefer explicit over clever. If a colleague needs to pause to understand a line, rewrite it.
- No nested ternaries — use early returns or variables.
- No more than 2 levels of nesting in any function.
- Side effects belong in clearly named functions, not hidden inside pure-looking code.
- Constants are `UPPER_SNAKE_CASE`. Shared constants live in one canonical location.

### Security
- Validate all input on the server. Client validation is UX, server validation is security.
- Never log PII (emails, names). Never expose secrets to the client bundle.
- Every server action checks auth and permissions before doing anything — use `guardedAction`, `requireUser()`, or `requireAdmin()`.
- Rate limit all mutation actions. Use `rateLimit()` with appropriate limits per action sensitivity.
- All external API responses must be validated at runtime (Zod or equivalent) — never trust `as SomeType` casts on external data.

### Testing
- Write tests BEFORE or DURING implementation, not after.
- Test behavior, not implementation. Test names describe scenarios in plain English.
- Every positive test has a corresponding negative test (wrong input, missing permissions, empty data).
- One primary assertion per test. If a test has 5+ expects testing different things, split it.
- No silent catches in production code — every catch either handles, rethrows, or logs with context.

### Quality gates
- Every change must pass: lint, typecheck, and all existing tests before commit.
- No PR-worthy change without tests for new behavior.
- Never leave TODO comments in code — add them to TODO.md with file path and description.
- If a refactor is needed but out of scope, add it to TODO.md immediately.

### Performance
- No N+1 queries — batch reads before loops, use `groupBy`/`findMany` instead of per-item queries.
- Import only what you need from libraries (deep imports for MUI icons, etc.).
- Paginate all list endpoints. Select only needed database fields.
- Measure before optimizing — no premature optimization without evidence.

### Accessibility
- Semantic HTML: use `<main>`, `<header>`, `<nav>`, `<section>` — not div soup.
- All `IconButton` components must have `aria-label` (MUI `Tooltip` does NOT substitute).
- Keyboard navigable always. Focus management on modals.
- Color contrast meets WCAG AA (4.5:1 for small text).

### Commits
- Atomic commits. Conventional Commits format. Every commit compiles and passes tests.
- If a change touches more than 10 files, consider breaking it up.

### The golden rule
Clean code is not a phase. It is how we write code. Every commit should leave the codebase better than it was found.
