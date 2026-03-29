# GDPR Coverage Analysis — Vuohiliitto Platform

*Last updated: 2026-03-29*

## What is this?

A community website where people sign in with Google/GitHub, chat, post on boards, and earn XP points. Real users, real data, hosted on Vercel (EU-compatible).

---

## What personal data do we collect?

| Data | Source | Why |
|------|--------|-----|
| Email | Google/GitHub OAuth | Unique identifier, login |
| Name | Google/GitHub OAuth | Display fallback |
| Profile picture URL | Google/GitHub OAuth | Avatar |
| Alias (callsign) | User types it in | Public display name instead of real name |
| IP address | HTTP request | Rate limiting only, deleted within 24h |
| Content they write | User-created | Posts, comments, chat messages, survey answers |

**We do NOT collect:** Phone numbers, physical addresses, payment info, location data, browsing history. **No analytics, no tracking pixels, no advertising, no third-party data sharing.**

---

## How we cover each GDPR right

### 1. Right to Access (Article 15)

User goes to `/account` and clicks **"Download My Data"**. They get a JSON file with ALL their data: profile, posts, comments, events, survey responses, permissions.

*Implementation: `exportMyData()` in `lib/gdpr-actions.ts`*

### 2. Right to Erasure — "Right to be forgotten" (Article 17)

User goes to `/account` and clicks **"Delete Account"**, then types "DELETE" to confirm. What happens:

- Email becomes `deleted-xxx@deleted.invalid`
- Name, alias, image, bio are set to null
- Role is set to pending, user is marked as deleted
- Authored content (posts, comments) is soft-deleted — removed from view but kept anonymized for 30 days, then permanently purged by an automated cleanup job
- Chat messages and issue reports are immediately hard-deleted

*Implementation: `deleteMyAccount()` in `lib/gdpr-actions.ts`*

### 3. Right to Rectification (Article 16)

- User can change their alias anytime from `/account`
- Development interest toggle is user-controlled
- Name and image come from OAuth provider (user updates those at Google/GitHub directly)

### 4. Right to Data Portability (Article 20)

Same "Download My Data" button — exports machine-readable JSON covering all user-generated content.

### 5. Lawful Basis (Article 6)

| Basis | What it covers |
|-------|---------------|
| **Contract/Necessity** | We need email to provide the service (login) |
| **Consent** | User explicitly clicks "Sign in with Google/GitHub" (OAuth consent screen) |
| **Legitimate interest** | Rate limiting (60-second window, anti-abuse) |

---

## Cookies & Storage

| What | Type | Consent needed? |
|------|------|-----------------|
| `authjs.session-token` | Auth cookie (JWT) | **No** — strictly necessary (GDPR Art. 5(3) exemption) |
| Theme preference | localStorage | **No** — never sent to server, stays on device |
| Survey completion flag | localStorage | **No** — never sent to server |

**No cookie consent banner needed.** We only use one strictly necessary authentication cookie. No analytics, no marketing cookies, no tracking.

---

## Data Retention

| Data type | Retention | Cleanup mechanism |
|-----------|-----------|-------------------|
| Active user data | Until user deletes account | User-initiated |
| Soft-deleted records | 30 days | Automated cron job (`/api/cron/purge-deleted`) |
| Rate limit entries | 60 seconds active, 24h max | Cron cleanup |
| IP addresses (rate limit) | Max 24 hours | Cron cleanup |
| localStorage | User's device only | User clears browser |

---

## Security measures (Article 32)

- **HTTPS only** — HSTS with 2-year max-age and preload
- **CSP headers** — restricts what can load on the page
- **No iframes** — X-Frame-Options: DENY
- **Secure auth tokens** — JWT-based, HttpOnly cookies
- **Role-based access** — 5 roles, 24 permission keys, hierarchy enforcement
- **Rate limiting** — 30 requests per 60 seconds per user
- **No OAuth tokens stored** — we only keep profile info, not access tokens

---

## Third-party processors

| Service | What data | Why | DPA needed? |
|---------|-----------|-----|-------------|
| **Vercel** (hosting) | All server-side data passes through | Hosting provider | Yes — Vercel has standard DPA |
| **Neon.tech** (database) | All stored data | PostgreSQL hosting | Yes — Neon has standard DPA |
| **Google OAuth** | Email, name, picture (at login only) | Authentication | Covered by Google's terms |
| **GitHub OAuth** | Email, name, picture (at login only) | Authentication | Covered by GitHub's terms |

**No other third parties.** No analytics (Google Analytics, Mixpanel, etc.), no CDNs for user data, no email services.

---

## Privacy Policy

Full policy published at [`/privacy`](https://vuohiliitto.com/privacy) on the site. Covers all 8 required sections:

1. What data we collect
2. How we use your data
3. Cookies and local storage
4. Third-party sharing
5. Data retention
6. Your rights (GDPR)
7. Security
8. Contact

---

## Summary

### What's good

- All four key GDPR rights implemented with actual working UI buttons (access, erasure, rectification, portability)
- Data minimization — only collects what's needed for the service
- No tracking or analytics at all
- Clear, readable privacy policy at `/privacy`
- Automated cleanup of deleted data (30-day retention, then permanent purge)
- Rate limit data has very short retention (seconds, not days)
- Only one cookie — strictly necessary for authentication

### Potential gaps to address

1. **No DPO (Data Protection Officer) appointed** — likely not required for a small community (not large-scale processing of sensitive data), but worth confirming based on member count and data volume
2. **No formal data processing register (Article 30)** — this document could serve as the basis for one
3. **No documented breach notification process** — GDPR requires notification to the supervisory authority within 72 hours of a breach; should have a written plan
4. **Privacy policy contact method** — currently says "contact the platform administrator" without a specific email address; should add one
5. **Demo mode data** — creates temporary test data with synthetic emails; cleaned up automatically but worth documenting in the privacy policy

---

*This analysis reflects the codebase as of 2026-03-29. The platform stores minimal personal data, implements all major GDPR rights, and uses no third-party tracking.*
