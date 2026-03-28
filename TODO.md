> **Current output style: explanatory** — Claude explains its reasoning and adds insight blocks alongside code changes. Switch with `/output-style concise` if you want less commentary.

# Platform — Task List

> Legend: 🟣 Opus task | 🔵 Sonnet task
> Each task is claimed by a Claude instance name (e.g. Claude 1, Claude 2)
> Completed tasks are removed from this list. Only open/in-progress tasks remain.

---

### Ongoing

- 🟣 **Ongoing:** Monitor CI pipeline and Vercel deployments, fix errors immediately — Claude 1

### Audit Findings — 2026-03-28 (updated)
> Full security, code quality, and test coverage audit. Findings verified and false positives removed.

#### 🟡 Important (fix this week)
> Previous 5 critical items resolved. New findings from deep audit below.

#### 🟢 Improvement (backlog)
- [ ] 🔵 [TESTING] test-animation page — low priority demo page

### Audit Summary
> - **Total findings:** 35 (5 resolved critical + 6 new important + 11 improvement + 13 test gaps)
> - **Security:** 10 | **Quality:** 12 | **Testing:** 13
> - **False positives removed:** 4 (env.local not in git, role hierarchy correct, CRON_SECRET rejects unauth, middleware callbackUrl is NOT an open redirect — matcher only hits /admin/*)
> - **Overall grade: A-** — All critical/important fixes done. 969 tests across 124 suites. CSP hardened (unsafe-inline removed from production script-src). Playwright E2E framework ready. Remaining: backlog-grade only.

### UX Fixes
> "Feedback & Survey" removed from UserMenu (done by Claude 2).

### GitHub & Branding
- [ ] 🔵 Add repo icon/social preview image and fix GitHub OAuth app visibility (logo, description)

### Survey System
> Support multiple surveys. Admin can view a list of all survey rounds with their results.

- [ ] 🟣 Survey list page — show all survey rounds with completion stats and links to results

### Vuohi Exclusive Features
> Features only visible to vuohi and superuser members.

- [ ] 🟣 Exclusive vuohi view/dashboard (separate from regular user view)
- [ ] 🟣 Shared calendar for vuohi members *(backlog — calendar deprioritized)*
- [ ] 🟣 Additional vuohi-only features TBD

### Gamification System — Quest & Achievement Engine
> WoW-inspired XP, quests, achievements, and leaderboard system.
> Users earn XP for platform actions, complete quests, unlock badges, and level up.

#### Phase 1 — Database & Core Engine ✅
> Completed by Claude 3. Schema, services, seed data all implemented.

#### Phase 2 — Integration with Existing Actions ✅
> Completed by Claude 3. All server actions hooked, login streak in auth callback.

#### Phase 3 — UI Components ✅
> All done: Quest Log, Achievements, Leaderboard, XP toasts, profile widget, level-up celebration, nav links.

#### Phase 4 — Admin & Polish ✅
> All done: Admin dashboard, quest reset cron, achievement/quest CRUD editor, full test coverage (65 tests).

### Guided Tour System — Role-Based Tutorial
> HRM-style guided tour ported to Platform. Role-aware steps, gamification-integrated.
> Tours are cumulative: higher roles include all lower-role steps.

#### Phase 1 — Core Engine ✅
> Completed by Claude 1. Schema, config (17 steps, 4 tiers), service, TutorialProvider.

#### Phase 2 — UI Components ✅
> Completed by Claude 1. Spotlight, Checklist, Celebration, data-tutorial attributes on 18+ elements, event emitters in 9 forms.

#### Phase 3 — Gamification + Integration ✅
> Completed by Claude 1. Tutorial quests/achievements seeded, XP rewards, i18n in 4 languages.

#### Phase 4 — Tests ✅
> Completed by Claude 1. 40 tests (config, service, UI components).

### Developer Onboarding
- [ ] 🟣 Contributor request page — public view where people can apply for repo edit rights to help develop the site

### Community Features — Backlog (hidden from UI)
> Forums and Calendar deprioritized. Boards still active for evaluation.

- [ ] 🔵 Boards — test existing implementation, evaluate if needed
- [ ] 🔵 Forums — backlog, evaluate later
- [ ] 🔵 Calendar — backlog, evaluate later
- [ ] 🔵 CalendarGrid.tsx refactor — split into CalendarDayCell + useCalendarLogic hook (backlog)

### Future — Port HRM Features to Platform
> Develop in HRM repo first, then port to Platform using same patterns, fresh code.
> HRM and Platform use SEPARATE databases. HRM is a standalone showpiece.

- [ ] 🟣 Department & Team management
- [ ] 🟣 Leave management system
- [ ] 🟣 Performance review system
- [ ] 🟣 Admin dashboard & analytics
- [ ] 🟣 Audit logging
- [ ] 🔵 2FA (TOTP) support
- [ ] 🔵 Concurrent session limiting

## Quick reference
Type `VUOHITIIMI` in any Claude Code instance to activate multi-agent coordination. It reads the current state, shows pending tasks, and asks what to work on. Use it also after a crash to resume.
