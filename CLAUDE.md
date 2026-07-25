# CLAUDE.md — Rally

> Project memory for Claude Code. Read this fully before writing any code.
> Rally is a **relationship intelligence platform for the events economy** (working name).
> This file is the source of truth for stack, architecture, and scope. When in doubt, follow this over your own defaults.

---

## What we are building (V1 / MVP)

A Progressive Web App that lets event attendees network and follow up, and gives organizers and sponsors intelligence on the relationships formed. It owns three moments:

- **Before:** "I know who I should meet."
- **During:** "I can capture every valuable connection."
- **After:** "I can convert those connections into opportunities."

The MVP exists to answer ONE question at a pilot event (GEF 2026): *will people use this to exchange and follow up, instead of business cards / LinkedIn — and will sponsors value the resulting lead data?*

---

## Locked stack — do NOT substitute without being asked

| Layer | Choice |
|---|---|
| Frontend | **React + Vite**, built as an installable **PWA** (service worker, manifest, add-to-home-screen). Mobile-first. React Router, React Query, Tailwind. |
| Backend | **Node.js + Express + TypeScript.** (NestJS was considered and rejected for MVP speed.) Keep modular. |
| Database | **Supabase (managed PostgreSQL).** Data access via Prisma or the Supabase client. |
| Auth | **Passwordless, email-OTP-first via Supabase Auth** (free). Phone is collected but **phone OTP verification is deferred to post-pilot.** |
| Storage | **Supabase Storage** for profile photos (store URLs, compress on upload). |
| QR | Generate with `qrcode`; scan in-browser with `html5-qrcode` (HTTPS required). QR encodes a **signed, rotating profile token**, never a raw id. |
| Hosting | Frontend: Vercel/Netlify. Backend: Render/Railway/Fly. DB: Supabase. Region closest to Ghana. |

**TypeScript everywhere. Low-data mandate:** bundle-split, lazy-load screens, compress images, cache the app shell offline. Must feel instant on 3G.

---

## Non-negotiable architecture rules

These are cheap now and very expensive to retrofit. Build them from the first commit.

1. **Account-level identity, not event-level.** One `account` per human, persists across all events.
2. **Dual identifier with dedup.** An `identifier` table holds two rows per account (`phone`, `email`), each `UNIQUE(type, value)`. On any registration, check BOTH before creating an account — if either matches, it's a returning user. This prevents duplicate/forked accounts.
3. **Base profile vs per-event participation — keep them separate tables.**
   - `profile` (base card: name, photo, title, company, links) — persists, reused every event.
   - `participation` (per event: `goals[]`, connections, notes, intent) — goals RESET per event.
4. **Signed registration handoff only.** Organizer pre-fill arrives as a **signed** token (HMAC/JWT), verified server-side, short expiry, one-time use. Never trust unsigned query params. On first creation via handoff, send ONE email OTP to verify.
5. **Connection intent is captured at connect time** (`partnership | customer | investment | talent | general`) and stored on `connection` and `sponsor_lead`. It powers organizer intelligence and sponsor lead quality.
6. **Security:** OTP rate-limited + hashed + 5-min expiry; QR tokens rotate & are signed; Supabase **Row-Level Security** scopes attendee data; organizer/sponsor reads are per-event only.

### Core tables
`account` · `identifier` · `profile` · `event` · `participation` · `connection` · `organizer` · `sponsor` · `sponsor_lead`
(See `/docs/build-spec` for full columns.)

---

## Scope guardrails — stay lean

**IN (V1):** dual-identifier accounts, cross-event login, base/per-event profile, QR exchange, connection intent, notes, WhatsApp follow-up (free `wa.me` deep links), post-event nudge (via WhatsApp/email, NOT web push), rules-based "who to meet", organizer dashboard, sponsor lead capture, signed pre-fill handoff.

**OUT — do NOT build these in V1 (defer to V2/V3):** AI matchmaking, LinkedIn login, in-app chat, meeting scheduling, gamification, deep per-organizer registration integrations, ticketing/CRM integrations, native mobile apps.

> If a feature isn't on the IN list, ask before building it. Default to deferring.

### Matching in V1 = rules-based, no ML
Score attendees by two-way goal/offer match; show top N with a plain-language "why". Deterministic and explainable. AI matchmaking is V2 (needs data the pilot generates).

### iOS PWA note
Camera QR works on iOS Safari + Android Chrome over HTTPS. **Do not rely on web push on iOS.** Deliver the post-event nudge via WhatsApp and email.

---

## Conventions

- **Language:** TypeScript, strict mode, on both frontend and backend.
- **Structure:** monorepo (`/apps/web`, `/apps/api`, `/packages/shared` for shared types) unless you propose better and I approve.
- **Shared types:** define API request/response types once in `/packages/shared` and import on both sides.
- **Commits:** small, frequent, conventional-commit style (`feat:`, `fix:`, `chore:`).
- **Env:** never hardcode secrets; use `.env` + an `.env.example`. Supabase keys, JWT/HMAC secrets, provider keys.
- **Tests:** unit-test the auth/dedup logic and the matching scorer at minimum.
- **Before big changes:** propose a short plan first, let me confirm, then implement.

---

## Build order (8-week sprint)

1. Repo, CI, Supabase schema + migrations, email-OTP auth, `account`+`identifier`+dedup.
2. Base profile CRUD + photo upload; `event` + `participation`; join-event with per-event goals.
3. QR generate + in-browser scanner; connect endpoint; connections list.
4. Intent capture; notes; hot flag; `wa.me` follow-up.
5. Rules-based discover ("people you should meet"); returning-user "welcome back".
6. Organizer dashboard (metrics + intent); sponsor lead capture + report.
7. Signed registration handoff; PWA polish (offline, install, low-data); post-event nudge.
8. Hardening: RLS, rate limits, load test, bug bash, dry-run with ~20 users.

Work one sprint slice at a time. Don't jump ahead.

---

## Reference docs (keep in `/docs`)
- Architecture & Roadmap — the "why" behind these rules.
- Technical Build Spec — full schema, API surface, flows.
- MVP prototype (HTML) — the intended look and feel of every screen.
