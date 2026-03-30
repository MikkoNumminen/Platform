> **Current output style: explanatory** — Claude explains its reasoning and adds insight blocks alongside code changes. Switch with `/output-style concise` if you want less commentary.

# Platform — Task List

> Legend: 🟣 Opus task | 🔵 Sonnet task
> Each task is claimed by a Claude instance name (e.g. Claude 1, Claude 2)
> Completed tasks are removed from this list. Only open/in-progress tasks remain.

---

### Ongoing

- 🟣 **Ongoing:** Monitor CI pipeline and Vercel deployments, fix errors immediately — Claude 1


### Private Messaging (DM System)
> User-voted feature from survey. Also needed for GDPR compliance: privacy@vuohiliitto.com has no actual inbox — privacy emails need to land somewhere. The DM system provides a Privacy Inbox for superuser where these messages appear.

- [ ] 🔵 Future: email webhook intake for privacy@vuohiliitto.com (not yet)

### DM Security & GDPR Audit — 2026-03-30
> Audit of the private messaging system. Strong auth/authorization/rate limiting in place.
> Critical gaps in GDPR compliance and privacy policy.

#### 🔴 Critical (fix before scaling)
- [ ] 🟣 Add DMs to GDPR data export — exportMyData() is missing Conversation and DirectMessage records — Claude 3
- [ ] 🔵 Update privacy policy to mention private messaging — Claude 3
- [ ] 🟣 Implement soft-delete for DMs — anonymize on account deletion instead of CASCADE hard-delete — Claude 3

#### 🟡 Important
- [ ] 🔵 Remove unused isPrivacy field from Conversation model — dead code, messaging lives in shoutbox
- [ ] 🔵 Add DM audit logging — log who accessed what conversation (GDPR accountability)
- [ ] 🔵 Define DM retention policy — no auto-expiry exists; decide on retention period or keep indefinitely

#### 🟢 Improvement
- [ ] 🔵 Add block/report mechanism for DM abuse
- [ ] 🔵 Add message deletion for users — allow deleting own sent messages
- [ ] 🔵 Consider field-level encryption for DM content at rest

> **Positive findings:** Auth checks solid, participant verification on all operations, demo mode properly isolated, rate limiting active, React escapes text (XSS mitigated), input validation (1-500 chars).

### GitHub & Branding
- [ ] 🔵 Add repo icon/social preview image and fix GitHub OAuth app visibility


### Vuohi Exclusive Features
- [ ] 🟣 Exclusive vuohi view/dashboard (separate from regular user view)

### Developer Onboarding
- [ ] 🟣 Contributor request page — public view where people can apply for repo edit rights

### Testing Backlog
- [ ] 🟣 Integration tests for multi-step workflows (signup → approval, board → post → thread)
- [ ] 🟣 Playwright E2E testing for critical user journeys

### Code Quality Audit
- [ ] 🟣 Full codebase review — code quality, reusability, modularity, dead code, consistency, error handling, performance, component structure, shared patterns

### XP System
- [ ] 🟣 Audit and analysis of the current XP system — balancing, caps, progression curve, quest rewards

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
- [ ] 🟣 Custom survey questions + DM testing round — Claude 1
- [ ] 🔵 2FA (TOTP) support
- [ ] 🔵 Concurrent session limiting

## Quick reference
Type `VUOHITIIMI` in any Claude Code instance to activate multi-agent coordination. It reads the current state, shows pending tasks, and asks what to work on. Use it also after a crash to resume.
