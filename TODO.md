> **Current output style: explanatory** — Claude explains its reasoning and adds insight blocks alongside code changes. Switch with `/output-style concise` if you want less commentary.

# Platform — Task List

> Legend: 🟣 Opus task | 🔵 Sonnet task
> Each task is claimed by a Claude instance name (e.g. Claude 1, Claude 2)
> Completed tasks are removed from this list. Only open/in-progress tasks remain.

---

### Ongoing

- 🟣 **Ongoing:** Monitor CI pipeline and Vercel deployments, fix errors immediately — Claude 1

### Demo Mode — Interactive Platform Showcase
> Zero-credential demo for unregistered visitors. Superuser account with isolated mock data.
> Branch merged. Seed data complete. Tutorial auto-activates. Nav hint fixed. README updated. (Claude 3)

#### Remaining — Claude 3
- [ ] 🔵 Demo-specific welcome overlay on first load — Claude 3

### Quest Log UX Refactor
> Show completed quests, merge custom quests into tabs, add progress summaries.

- [ ] 🔵 Show completed quests in each tab (greyed out with checkmark, below active) — Claude 3
- [ ] 🔵 Add progress summary per tab ("3/5 complete") in tab labels — Claude 3
- [ ] 🔵 Merge custom quests into tabs — assigned quests show in "Assigned" tab — Claude 3
- [ ] 🔵 Highlight active/in-progress quests with visual emphasis — Claude 3
- [ ] 🔵 Update getActiveQuests to return completed quests too — Claude 3

### GDPR Compliance Gaps
> From GDPR analysis. Address before scaling up.

- [ ] 🔵 Add specific contact email to privacy policy
- [ ] 🔵 Document a breach notification process (72-hour GDPR requirement)
- [ ] 🔵 Create a formal Article 30 data processing register
- [ ] 🔵 Confirm whether DPO appointment is needed
- [ ] 🔵 Document demo mode data handling in privacy policy

### GitHub & Branding
- [ ] 🔵 Add repo icon/social preview image and fix GitHub OAuth app visibility

### Survey System
- [ ] 🟣 Survey list page — show all survey rounds with completion stats and links to results

### Vuohi Exclusive Features
- [ ] 🟣 Exclusive vuohi view/dashboard (separate from regular user view)

### Developer Onboarding
- [ ] 🟣 Contributor request page — public view where people can apply for repo edit rights

### Testing Backlog
- [ ] 🔵 test-animation page tests
- [ ] 🔵 Tests for DevLog component — Claude 3
- [ ] 🟣 Integration tests for multi-step workflows (signup → approval, board → post → thread)
- [ ] 🟣 Playwright E2E testing for critical user journeys

### Backlog — Ideas
- [ ] 🟣 Evaluate custom username/password login (in addition to OAuth providers)

### Community Features — Backlog (hidden from UI)
- [ ] 🔵 Boards — test existing implementation, evaluate if needed
- [ ] 🔵 Forums — backlog, evaluate later
- [ ] 🔵 Calendar — backlog, evaluate later

### Future — Port HRM Features to Platform
- [ ] 🟣 Department & Team management
- [ ] 🟣 Leave management system
- [ ] 🟣 Performance review system
- [ ] 🟣 Admin dashboard & analytics
- [ ] 🟣 Audit logging
- [ ] 🔵 2FA (TOTP) support
- [ ] 🔵 Concurrent session limiting

## Quick reference
Type `VUOHITIIMI` in any Claude Code instance to activate multi-agent coordination. It reads the current state, shows pending tasks, and asks what to work on. Use it also after a crash to resume.
