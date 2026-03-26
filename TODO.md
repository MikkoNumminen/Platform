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
- [ ] 🔵 Set up PostgreSQL and run first migration — User

---

## Community Platform — HRM-Grade Build

### Phase 1: Security Infrastructure
> Port HRM's security patterns: guardedAction, actionErrors, rate limiting, audit logging.

- [ ] 🟣 Build guardedAction utility (permission check + rate limiting wrapper) — Claude 3
- [ ] 🔵 Build actionErrors system (typed error codes + ActionError class) — Claude 3
- [ ] 🔵 Build actionUtils (safe wrapper, ActionResult type, UUID validation) — Claude 3
- [ ] 🔵 Build rate limiting (PostgreSQL-based atomic sliding window) — Claude 3
- [ ] 🔵 Add RateLimit model to Prisma schema — Claude 3
- [ ] 🔵 Add security infrastructure test suite — Claude 3

### Phase 2: Wire Board System to Database
> "Shouting board" — replace mock data with real CRUD via server actions.

- [ ] 🟣 Build board feature module (actions/queries/schemas) — Claude 3
- [ ] 🔵 Build post feature module (actions/queries/schemas) — Claude 3
- [ ] 🔵 Wire board listing page to database — Claude 3
- [ ] 🔵 Build create/edit/delete board UI — Claude 3
- [ ] 🔵 Build create/edit/delete post UI — Claude 3
- [ ] 🔵 Wire thread/comment system to database — Claude 3
- [ ] 🔵 Add board & post test suite — Claude 3

### Phase 3: Wire Calendar to Database
> Replace mock events with real CRUD via server actions.

- [ ] 🟣 Build calendar event feature module (actions/queries/schemas) — Claude 3
- [ ] 🔵 Wire calendar page to database — Claude 3
- [ ] 🔵 Build create/edit/delete event UI — Claude 3
- [ ] 🔵 Add calendar test suite — Claude 3

### Phase 4: Shared Components
> Port HRM's battle-tested shared components.

- [ ] 🔵 Build DataTable component (sortable, paginated, searchable) — Claude 3
- [ ] 🔵 Build ConfirmDialog component — Claude 3
- [ ] 🔵 Build EmptyState component — Claude 3
- [ ] 🔵 Build SnackbarProvider (success/error notifications) — Claude 3
- [ ] 🔵 Add shared component test suite — Claude 3

### Phase 5: Polish & Security Hardening
> Final security layers and UX polish.

- [ ] 🔵 Add CSP with nonce and security headers — Claude 3
- [ ] 🔵 Add loading skeletons for all routes — Claude 3
- [ ] 🔵 Add keyboard shortcuts system — Claude 3

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
