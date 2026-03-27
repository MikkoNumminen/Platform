# Platform — Task List

> Legend: 🟣 Opus task | 🔵 Sonnet task
> Each task is claimed by a Claude instance name (e.g. Claude 1, Claude 2)
> Completed tasks are removed from this list. Only open/in-progress tasks remain.

---

### Ongoing

- 🟣 **Ongoing:** Monitor CI pipeline and Vercel deployments, fix errors immediately — Claude 1

### Security Fixes
> Found during security scan. Priority ordered.

- [ ] 🔵 Add permission check to survey results page (`/admin/survey-results`) — missing `survey:results` permission guard
- [ ] 🟣 Add ownership verification to edit/delete actions — `post-actions.ts`, `thread-actions.ts`, `calendar-actions.ts` allow any permitted user to modify any user's content
- [ ] 🔵 Middleware: check user role on `/admin/*` routes, not just session token existence
- [ ] 🔵 CSP: remove `unsafe-eval` from production `script-src`, consider nonce-based approach for `unsafe-inline`
- [ ] 🔵 CSP: restrict `connect-src` to specific domains instead of blanket `https:`
- [ ] 🔵 Enable TypeScript strict mode and fix resulting type errors

### GitHub & Branding
- [ ] 🔵 Add repo icon/social preview image and fix GitHub OAuth app visibility (logo, description)

### Survey System
> Support multiple surveys. Admin can view a list of all survey rounds with their results.

- [ ] 🟣 Survey list page — show all survey rounds with completion stats and links to results

### Vuohi Exclusive Features
> Features only visible to vuohi and superuser members.

- [ ] 🟣 Exclusive vuohi view/dashboard (separate from regular user view)
- [ ] 🟣 Shared calendar for vuohi members
- [ ] 🟣 Additional vuohi-only features TBD

### Community Features — Review & Test (hidden from UI)
> These features are hidden while we evaluate whether they're needed and in what form.

- [ ] 🔵 Boards — test existing implementation, evaluate if needed
- [ ] 🔵 Forums — test existing implementation, evaluate if needed
- [ ] 🔵 Calendar — test existing implementation, evaluate if needed

### Future — Port HRM Features to Platform
> Develop in HRM repo first, then port to Platform using same patterns, fresh code.
> HRM and Platform use SEPARATE databases. HRM is a standalone showpiece.

- [ ] 🟣 Department & Team management
- [ ] 🟣 Leave management system
- [ ] 🟣 Performance review system
- [ ] 🟣 Admin dashboard & analytics
- [ ] 🟣 Audit logging
- [ ] 🟣 i18n (next-intl)
- [ ] 🔵 2FA (TOTP) support
- [ ] 🔵 Concurrent session limiting
