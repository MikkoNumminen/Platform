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
- [ ] 🟣 [TESTING] Add integration tests for multi-step workflows (signup → approval, board → post → thread)
- [ ] 🟣 [TESTING] Set up Playwright E2E testing for critical user journeys

### Audit Summary
> - **Total findings:** 35 (5 resolved critical + 6 new important + 11 improvement + 13 test gaps)
> - **Security:** 10 | **Quality:** 12 | **Testing:** 13
> - **False positives removed:** 4 (env.local not in git, role hierarchy correct, CRON_SECRET rejects unauth, middleware callbackUrl is NOT an open redirect — matcher only hits /admin/*)
> - **Overall grade: A-** — All critical/important fixes done. 936 tests across 122 suites. CSP hardened (unsafe-inline removed from production script-src). Remaining: backlog-grade only.

### UX Fixes
> "Feedback & Survey" removed from UserMenu (done by Claude 2).

### Code Quality
> Color centralization done: all component colors use `colors.*` tokens from styles.ts (Claude 2).

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

### Custom Quest System — Superuser-Assigned Quests
> Superuser creates custom quests and assigns them to specific users.
> Quests are configurable (title, description, XP reward, deadline, assignee).
> Only superuser can create/edit/complete quests. Vuohi and admins can view the global quest list.
> Users see their assigned quests in a personal quest list.
> Completing a quest awards XP and can trigger achievements.
> Example: "Check if platform GDPR compliance is up to date" assigned to a specific user.

#### Phase 1 — Schema & Backend ✅
> CustomQuest model, CRUD actions (create/update/complete/delete), permission gates (quest:manage, quest:view).

#### Phase 2 — Admin UI ✅
> `/admin/quests` page with global quest list, status filters, creation form, edit dialog, status management.

#### Phase 3 — User UI ✅
> `/my-quests` page showing assigned quests with status/priority/XP. Menu link added for approved users.

#### Phase 4 — Gamification Integration ✅
> Custom XP awards on completion (configurable per quest). 11 tests covering all CRUD + permissions.

### Skill-Targeted Quests — Double XP for Matching Skills ✅
> Custom quests can target a development skill. 2x XP when assignee has matching skill.
> Completed by Claude 1. Schema, actions, admin UI skill selector, quest card badges, 2 new tests.

### Demo Mode — Interactive Platform Showcase
> Zero-credential demo for unregistered visitors. Superuser account with isolated mock data.
> All real community data hidden. Tutorial guides through every feature.
> Architecture: config-driven step registry so new features auto-integrate.

#### Phase 1 — Merge demo branch + seed data gaps
- [ ] 🟣 Merge feat/demo-mode into master (resolve conflicts with custom quests, feedback system, skill quests) — Claude 3
- [ ] 🟣 Seed quest progress + achievement unlocks for demo users (currently empty on /quests and /achievements) — Claude 3
- [ ] 🟣 Seed CustomQuest data for demo (show quest board with assigned quests) — Claude 3
- [ ] 🟣 Seed SurveyRound for demo (show feedback page with active round + past results) — Claude 3

#### Phase 2 — Demo tour integration
- [ ] 🟣 Auto-activate tutorial for demo user (fresh tour state, skip set_alias since already set) — Claude 3
- [ ] 🟣 Make tutorial config extensible — step registry pattern so new features can register steps without editing core config — Claude 3
- [ ] 🔵 Fix nav hint for report_issue step (selector mismatch after UserMenu consolidation) — Claude 3

#### Phase 3 — Polish + tests
- [ ] 🔵 Demo-specific welcome overlay on first load (brief "Welcome to the demo" with feature highlights) — Claude 3
- [ ] 🟣 Tests for demo seed data completeness, tutorial step coverage, session isolation — Claude 3
- [ ] 🔵 README: document demo mode setup, env variables, how to add new demo tour steps — Claude 3

### GDPR Compliance Gaps
> From GDPR analysis (see GDPR-ANALYSIS.md). Address before scaling up.

- [ ] 🔵 Add specific contact email to privacy policy (currently says "contact the administrator")
- [ ] 🔵 Document a breach notification process (72-hour GDPR requirement)
- [ ] 🔵 Create a formal Article 30 data processing register (based on GDPR-ANALYSIS.md)
- [ ] 🔵 Confirm whether DPO appointment is needed based on user count and data volume
- [ ] 🔵 Document demo mode data handling in the privacy policy

### Developer Onboarding
- [ ] 🟣 Contributor request page — public view where people can apply for repo edit rights to help develop the site

### Backlog — Ideas
- [ ] 🟣 Evaluate custom username/password login (in addition to OAuth providers)

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
