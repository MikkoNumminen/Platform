# Production Readiness Audit

**Date:** 2026-04-03
**Scope:** `apps/web/` — full codebase audit
**Auditor:** Claude Opus 4.6 (automated, 6 parallel domain scans)

---

## Executive Summary

The codebase has a solid foundation: consistent auth patterns (`guardedAction`, `safe()`, `requireUser()`), working rate limiting, demo session isolation, comprehensive test suite (1263 tests, 143 suites), conventional commits, and clean dependency management. The critical findings are specific gaps rather than systemic failures.

**Overall Grade: B-**

| Category | 🔴 Critical | 🟡 Important | 🟢 Improvement | Total |
|----------|-------------|--------------|-----------------|-------|
| Security | 3 | 12 | 4 | 19 |
| Type Safety & Errors | 3 | 18 | 2 | 23 |
| Code Structure & Naming | 6 | 16 | 4 | 26 |
| Testing | 3 | 7 | 6 | 16 |
| Performance & Accessibility | 7 | 8 | 3 | 18 |
| Dependencies & Config | 5 | 11 | 3 | 19 |
| **Total** | **27** | **72** | **22** | **121** |

---

## 🔴 Critical Findings

### Security

**S1. Demo login has no server-side gate**
`auth.ts:28` — Demo user created as `superuser` with only a client-side `NEXT_PUBLIC_DEMO_LOGIN` flag controlling visibility. If accidentally left enabled in production, any visitor gets full superuser access.
Fix: Add server-side `DEMO_MODE` env check in the `authorize()` callback.

**S2. DM actions bypass `dm:send` permission**
`lib/dm-actions.ts:15,64` — `sendDirectMessage` and `startConversation` use `requireUser()` instead of `guardedAction("dm:send", ...)`. Pending users can call these directly.
Fix: Wrap both in `guardedAction("dm:send", ...)`.

**S3. `getDmUsers()` exposes email addresses to all authenticated users**
`lib/dm-queries.ts:150` — Returns `email` for every non-pending user. Email is PII that should only be visible to admins or via `/who` for superusers.
Fix: Remove `email` from the default select. Only include it for superuser/admin callers, or restrict to `/who` command only.

### Type Safety

**T1. No Zod or runtime validation for external API responses**
No Zod in the project. External API responses (Raider.IO, GitHub) are cast with `as` without validation. If APIs change schema, the app silently produces `undefined` values.
Fix: Add Zod schemas for `RaiderIoResponse` and GitHub commit API responses.

**T2. `check-promotion` API route has no try/catch**
`app/api/check-promotion/route.ts` — Two Prisma calls with no error handling. DB errors crash with unhandled 500.
Fix: Wrap in try/catch returning `{ promoted: false }` on error.

**T3. GitHub commits response is completely untyped**
`lib/github-commits.ts:27` — `commits` is `any` from `Response.json()`. Field accesses (`c.sha`, `c.commit.message`) are unchecked.
Fix: Type the response or validate with Zod.

### Code Structure

**C1. `DmUser` type defined in 3 files**
`Shoutbox.tsx:39`, `DirectMessages.tsx:26`, `UserPicker.tsx:7` — Identical type repeated.
Fix: Export from `lib/dm-queries.ts`, import everywhere.

**C2. `WHISPER_COLOR` defined in 5+ files**
`"#FF80FF"` repeated in Shoutbox, DirectMessages, ShoutboxTabBar, UserPicker, SystemMessages, WhisperMessages.
Fix: Move to `app/styles.ts` as `colors.whisper`.

**C3. `CRITERIA_ACTIONS` duplicated in AchievementEditor and QuestEditor**
Identical arrays in both files.
Fix: Export from `lib/gamification/xp-config.ts`.

**C4. DM sending logic duplicated between Shoutbox and DirectMessages**
`/w` command handling, optimistic updates, `ensureUsersLoaded`, `openConversation` — near-identical in both ~700-line files.
Fix: Extract `useDmConversations` custom hook.

**C5. `handleSubmit` in Shoutbox is 247 lines**
`Shoutbox.tsx:217-464` — Single function handling `/help`, `/who`, `/motd`, `/w`, guild send, DM send.
Fix: Extract per-command handler functions.

**C6. `DEMO_EMAIL` defined in 3 places**
`user-queries.ts:4`, `demo-session.ts:23`, hard-coded in `dm-queries.ts:148`.
Fix: Single export, import everywhere.

### Testing

**TE1. `auth.ts` callbacks completely untested**
`auth.test.ts` only verifies exports exist. The 196-line auth config with signIn callback (first-user superuser promotion), JWT callback (permission hydration), and session callback has zero behavioral tests.
Fix: Extract and test each callback function.

**TE2. JWT permission-version drift detection untested**
`auth.ts:122-153` — The mechanism that propagates permission changes to active sessions is completely untested. A bug here causes stale permissions.
Fix: Test JWT callback with `permissionsVersion` mismatch scenario.

**TE3. GDPR export test has 18 assertions**
`gdpr-actions.test.ts:242` — Tests shape and data mapping in one test. When it fails, you can't tell what broke.
Fix: Split into "export has correct keys" and "export includes each data source".

### Performance & Accessibility

**P1. N+1 query in `getMyConversations`**
`lib/dm-queries.ts:54-78` — `directMessage.count()` called per conversation in a loop.
Fix: Single `groupBy` query for all unread counts.

**P2. N+1 query in `checkAchievements`**
`lib/gamification/achievement-service.ts:37-57` — `getActionCount()` called per achievement.
Fix: Batch-fetch counts for distinct actions before the loop.

**P3. N+1 query in `updateQuestProgress`**
`lib/gamification/quest-service.ts:14-63` — `findUnique` + `upsert` per quest in loop.
Fix: Pre-load all progress rows, filter quests by action at DB level.

**P4. No skip-to-content link**
`app/layout.tsx` — Screen reader users must tab through entire TopBar on every page.
Fix: Add skip link as first child of `<body>`.

**P5. No `<main>` landmark**
`app/layout.tsx` — No semantic `<main>`, `<header>`, or `<nav>` elements anywhere.
Fix: Add `component="main"` to content wrapper, confirm TopBar renders as `<header>`.

**P6. UserMenu avatar button missing `aria-label`**
`app/components/UserMenu.tsx:141` — Screen reader announces "button" with no context.
Fix: Add `aria-label={`Open menu for ${displayName}`}`.

**P7. 18+ icon buttons missing `aria-label`**
Across QuestListClient, QuestEditor, AchievementEditor, MythicPlus components, CampaignQuestPanel, TutorialChecklist, DirectMessages, ShoutboxTabBar — `Tooltip` title does NOT substitute for `aria-label`.
Fix: Add `aria-label` matching tooltip text to every `IconButton`.

### Dependencies & Config

**D1. `prisma@7.5.0` has HIGH vulnerabilities**
12 vulnerabilities (7 HIGH, 5 MODERATE) via transitive dependencies.
Fix: `npm install --save-dev prisma@latest` (>=7.6.0).

**D2. `GITHUB_TOKEN` undocumented in `.env.example`**
Used in `github-commits.ts:14` but not in `.env.example`.
Fix: Add to `.env.example` with description.

**D3. `NEXT_PUBLIC_DEMO_LOGIN` undocumented in `.env.example`**
Controls demo login visibility but not documented.
Fix: Add to `.env.example`.

**D4. Coverage not enforced in CI**
`jest --verbose` runs without `--coverage` or threshold. Coverage can drop to zero silently.
Fix: Add `coverageThreshold` to jest config, use `test:coverage` in CI.

**D5. `GITHUB_TOKEN` not injected in CI build step**
Build step may hit GitHub API unauthenticated, causing rate limit failures.
Fix: Add `env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` to build step.

---

## 🟡 Important Findings

### Security

- **S4.** `refreshAllCharacters` fetches all users' characters, not just caller's (`mythicplus-actions.ts:154`)
- **S5.** `setAlias` has no rate limiting — enables alias enumeration (`alias-actions.ts:31`)
- **S6.** Admins with `post:edit` cannot edit others' posts — permission is non-functional (`post-actions.ts:93`)
- **S7.** `requireAdmin` in gamification admin-actions excludes `vuohi` role (`gamification/admin-actions.ts:20`)
- **S8.** `submitCustomSurvey` allows unauthenticated submission (`survey-actions.ts:79`)
- **S9.** `fetchRoundResults` has no auth/permission check (`survey-round-actions.ts:107`)
- **S10.** Middleware only guards `/admin` — no defense-in-depth for other routes (`middleware.ts:41`)
- **S11.** Deleted user's email stored in audit log defeats GDPR erasure (`gdpr-actions.ts:47`)
- **S12.** `CustomQuest` has no `sessionId` — demo/real data can bleed (`demo-session.ts:199`)
- **S13.** `realm` field has no max-length check (`mythicplus-actions.ts:27`)
- **S14.** Issue `url` field has no format or length validation (`issue-actions.ts:46`)
- **S15.** All rate limits share same 30/min regardless of sensitivity (`rateLimit.ts:6`)

### Type Safety

- **T4.** Unsafe cast of Prisma JSON `criteria` field — no validation (`achievement-service.ts:47`, `quest-service.ts:16`)
- **T5.** Unsafe casts of Prisma JSON columns `customQuestions`/`customAnswers` (`survey-queries.ts:74,85,97`)
- **T6.** `startConversation` return uses fragile `as ActionResult & { conversationId? }` cast (`dm-actions.ts:135`)
- **T7.** `DATABASE_URL!` non-null assertion gives cryptic error if missing (`lib/db.ts:7`)
- **T8.** `AUTH_SECRET!` same issue (`middleware.ts:23`)
- **T9.** ~15 files cast `session.user as { role?: string }` — redundant, already in `next-auth.d.ts`
- **T10.** ~8 silent `catch { return []; }` blocks with no logging across gamification services
- **T11.** 4 `console.error` calls in tutorial-service instead of `logger.error`
- **T12.** `CampaignQuestPanel` `.catch(() => {})` silently swallows errors
- **T13.** ~10 exported functions missing explicit return types across gamification services
- **T14.** Wrong error code `"invalidEventTitle"` used for non-title fields (`calendar-schemas.ts:43,47,58,61`)
- **T15.** Double-cast `as Prisma.InputJsonValue as Prisma.InputJsonValue` (`gamification/admin-actions.ts:93`)
- **T16.** `Raider.IO` response cast without validation (`lib/raiderio.ts:63`)
- **T17.** `fetchUserPermissionOverrides` not wrapped in try/catch (`user-actions.ts:119`)
- **T18.** `actionUtils.ts:54` — redundant cast `(user as { role? })` when `next-auth.d.ts` already declares `role`

### Code Structure

- **C7.** 38 files over 200 lines (largest: Shoutbox.tsx at 691)
- **C8.** Chip styling pattern repeated ~20 times across quest/admin views — extract `StatusChip`/`PriorityChip`
- **C9.** `demoReacted` → `hasDemoReacted`, `dialog` → `isDialogOpen` (naming)
- **C10.** `closeTab`/`closeConvTab` should be `handleCloseTab`/`handleCloseConversationTab`
- **C11.** Abbreviations `ld`, `qc`, `ta`, `idx`, `val` in loop bodies
- **C12.** Nested ternary in Shoutbox placeholder text and 5 submit-label patterns
- **C13.** IIFE inside JSX in Shoutbox ghost text rendering
- **C14.** `localStorage.removeItem("tutorial-progress")` duplicated in DemoBanner and UserMenu
- **C15.** UI `maxLength` values hardcoded instead of importing from lib constants
- **C16.** Chat height `300` magic number in Shoutbox and DirectMessages
- **C17.** Dead `error: _error` props in AchievementEditor and QuestEditor
- **C18.** Rating thresholds magic numbers in `TeamComposition.tsx`

### Testing

- **TE4.** `admin-gamification.test.ts` has 15 assertions across 6 unrelated behaviors
- **TE5.** `deleteQuest` missing "non-admin rejected" negative test
- **TE6.** No test for DB error fallback in `getGamificationStats`
- **TE7.** `setting-queries.ts` — `getMotd()` has no test file
- **TE8.** `seed-dm-testing.ts` — complex superuser-only operation with no tests
- **TE9.** XP cap edge case: below-cap award that exceeds cap after award — not tested
- **TE10.** Inconsistent `guardedAction` mock strategy across 8 test files

### Performance & Accessibility

- **P8.** Missing pagination on `getIssueReports`, `getUsers`, `getPostsByBoard`
- **P9.** Audit log page fetches 500 rows to client (`admin/audit-log/page.tsx:19`)
- **P10.** Survey results loads all responses in-memory for aggregation
- **P11.** Shoutbox has 14 `useState` calls causing broad re-renders
- **P12.** Expand buttons in CampaignQuestPanel and TutorialChecklist have no `onClick` (keyboard broken)
- **P13.** `framer-motion` (~40kB) loaded on unauthenticated landing page
- **P14.** `retro`/`fantasy` theme caption text contrast ~4.1:1 (below AA 4.5:1 for small text)
- **P15.** `getMotd()` not cached — fires on every request for rarely-changing data

### Dependencies & Config

- **D6.** `next-auth@^5.0.0-beta.30` — caret range on beta is risky
- **D7.** `moduleResolution: "node"` deprecated, suppressed with `ignoreDeprecations`
- **D8.** ESLint missing `no-explicit-any: error` rule
- **D9.** No `coverageThreshold` in jest config
- **D10.** `UserLevel` missing index on `level` and `totalXp`
- **D11.** `XpTransaction` missing compound index on `[userId, source]`
- **D12.** `Conversation` unique constraint with nullable `sessionId` allows duplicate rows
- **D13.** `SurveyRound.creatorId` missing explicit cascade rule
- **D14.** `AuditLog.actorId` has no FK to User — orphaned IDs possible
- **D15.** CI: all steps serial in one job — slow feedback
- **D16.** No `.next/cache` persistence in CI

---

## 🟢 Improvement Findings

- **I1.** `AUTH_SECRET!` in middleware — add explicit env check
- **I2.** CSP missing `object-src 'none'` and `media-src 'self'`
- **I3.** `deadline` not validated for `isNaN` or past date (`custom-quest-actions.ts:74`)
- **I4.** `otherUserId` not `validateUUID`'d in `startConversation` (`dm-actions.ts:65`)
- **I5.** Real audit logs never purged — accumulate indefinitely
- **I6.** Hardcoded hex colors in DemoBanner, UserMenu, signin page — use `colors.*` tokens
- **I7.** `ActiveTab = "guild" | string` type too wide — tighten the union
- **I8.** `@types/jest-axe` redundant — `jest-axe@10` ships own types
- **I9.** No `db:seed` script in `package.json`
- **I10.** `test-animation` route exists in production (renders nothing)
- **I11.** `X-XSS-Protection` header is deprecated — remove
- **I12.** Tests not co-located with source (all in `app/__tests__/`)
- **I13.** 6 stale git stash entries
- **I14.** `permissions.test.ts` only spot-checks 3 of 28 keys
- **I15.** `beforeAll` shared mutable `let` in mockEvents/mockThreads tests
- **I16.** Survey/query test files missing `jest.clearAllMocks()` in `beforeEach`
- **I17.** Lazy-load celebration components with `next/dynamic`
- **I18.** `WelcomeHero` could use CSS animations instead of framer-motion
- **I19.** `quest-service.ts` `getActiveQuests()` fetches all columns when fewer needed
- **I20.** `revalidatePath` used correctly everywhere (positive finding)
- **I21.** All `@mui/icons-material` imports use deep paths (positive finding)
- **I22.** Key props on all lists use stable IDs (positive finding)

---

## Positive Findings

- Zero `any` types in production code (all confined to test files)
- `strict: true` in tsconfig
- Consistent `safe()` + `ActionError` pattern across server actions
- UUID validation helper used consistently
- Rate limiting on all user-facing creation actions
- Demo session isolation is robust — all queries use `sessionId` scoping
- `revalidatePath` called after every mutation
- Conventional commits followed consistently
- Lock files committed
- No `NEXT_PUBLIC_` secrets
- Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) all present
- All list renders use stable `key` props
- Deep imports for MUI icons (tree-shaking preserved)
