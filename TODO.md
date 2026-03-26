# Platform — Task List

> Legend: 🟣 Opus task | 🔵 Sonnet task
> Each task is claimed by a Claude instance name (e.g. Claude 1, Claude 2)

## Completed

All 30 tasks across Infrastructure, Shared Packages, Authentication, Core Features, Themes, Testing, and Polish & Deployment have been completed.

## Survey
- [x] 🟣 Set up Prisma v7 database infrastructure — Claude 2
- [x] 🔵 Add SurveyResponse model — Claude 2
- [x] 🔵 Add survey config, validation, and server action — Claude 2
- [x] 🔵 Build survey form components (stepper, single/multi select, text) — Claude 2
- [x] 🔵 Add /survey page and homepage CTA — Claude 2
- [x] 🔵 Add admin survey results page — Claude 2
- [x] 🔵 Add survey test suite (12 test files) — Claude 2
- [x] 🔵 Set up PostgreSQL and run first migration — Claude 1

---

## Community Platform — HRM-Grade Build

### Phase 1: Security Infrastructure
> Port HRM's security patterns: guardedAction, actionErrors, rate limiting, audit logging.

- [x] 🟣 Build guardedAction utility (permission check + rate limiting wrapper) — Claude 3
- [x] 🔵 Build actionErrors system (typed error codes + ActionError class) — Claude 3
- [x] 🔵 Build actionUtils (safe wrapper, ActionResult type, UUID validation) — Claude 3
- [x] 🔵 Build rate limiting (PostgreSQL-based atomic sliding window) — Claude 3
- [x] 🔵 Add RateLimit model to Prisma schema — Claude 3
- [x] 🔵 Add security infrastructure test suite — Claude 1

### Phase 2: Wire Board System to Database
> "Shouting board" — replace mock data with real CRUD via server actions.

- [x] 🟣 Build board feature module (actions/queries/schemas) — Claude 1
- [x] 🔵 Build post feature module (actions/queries/schemas) — Claude 1
- [x] 🔵 Wire board listing page to database — Claude 1
- [x] 🔵 Build create/edit/delete board UI — Claude 1
- [x] 🔵 Build create/edit/delete post UI — Claude 1
- [x] 🔵 Wire thread/comment system to database — Claude 1
- [x] 🔵 Add board & post test suite — Claude 1

### Phase 3: Wire Calendar to Database
> Replace mock events with real CRUD via server actions.

- [x] 🟣 Build calendar event feature module (actions/queries/schemas) — Claude 3
- [x] 🔵 Wire calendar page to database — Claude 3
- [x] 🔵 Build create/edit/delete event UI — Claude 3
- [x] 🔵 Add calendar test suite — Claude 3

### Phase 4: Shared Components
> Port HRM's battle-tested shared components.

- [x] 🔵 Build DataTable component (sortable, paginated, searchable) — Claude 1
- [x] 🔵 Build ConfirmDialog component — Claude 1 (built as ConfirmDeleteDialog)
- [x] 🔵 Build EmptyState component — Claude 1
- [x] 🔵 Build SnackbarProvider (success/error notifications) — Claude 1
- [x] 🔵 Add shared component test suite — Claude 1

### Phase 5: Polish & Security Hardening
> Final security layers and UX polish.

- [x] 🔵 Add CSP with nonce and security headers — Claude 1
- [x] 🔵 Add loading skeletons for all routes — Claude 1
- [x] 🔵 Add keyboard shortcuts system — Claude 1
- [x] 🔵 Fix lint errors in Phase 5 tests and components (26 errors) — Claude 3

### Documentation
- [x] 🔵 Update README.md with new features, structure, and commands — Claude 1

### Deployment & Auth
- [x] 🟣 Add roles, permissions, and user creation on login — Claude 2
- [x] 🔵 Hide survey CTA after submission — Claude 2
- [ ] 🔵 Fix Vercel deployment for monorepo — Claude 2 (in progress)

### Future — HRM Features (not started)
> These come later once the community platform is solid.

- [ ] 🟣 Person/Employee management
- [ ] 🟣 Department & Team management
- [ ] 🟣 Leave management system
- [ ] 🟣 Performance review system
- [ ] 🟣 Admin dashboard & analytics
- [ ] 🟣 Audit logging (MongoDB + hash chain)
- [ ] 🟣 i18n (next-intl, 18 locales)
- [ ] 🔵 2FA (TOTP) support
- [ ] 🔵 Concurrent session limiting
