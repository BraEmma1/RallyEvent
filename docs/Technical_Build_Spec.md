# Rally — Technical Build Spec (V1 / MVP)

> Stack LOCKED (budget-conscious). Full schema, API, flows. Pairs with Architecture & Roadmap.

## 1. Scope
Ship V1 only. **IN:** dual-identifier accounts, cross-event login, base/per-event profile, QR exchange, connection intent, notes, WhatsApp follow-up, post-event nudge, rules-based "who to meet", organizer dashboard, sponsor lead capture, signed pre-fill handoff. **OUT (V2+):** AI matchmaking, LinkedIn login, deep per-organizer integrations, ticketing/CRM.

## 2. Stack (LOCKED)

| Layer | Decision |
|---|---|
| Frontend | React + Vite, installable PWA. Mobile-first, React Router, React Query, Tailwind. iOS + Android from one codebase. |
| Backend | Node.js + Express + TypeScript (chosen over NestJS for MVP speed). Modular. |
| Database | Supabase (managed PostgreSQL). Free tier covers pilot. Prisma or Supabase client. |
| Auth | Passwordless, **email-OTP-first** via Supabase Auth (free). Phone collected for `wa.me`; **phone OTP deferred post-pilot.** |
| QR | Generate `qrcode`; scan `html5-qrcode` (HTTPS). QR = signed rotating profile token. |
| Media | Supabase Storage; store URLs, compress on upload. |
| Hosting | Frontend Vercel/Netlify; backend Render/Railway/Fly; DB Supabase. Region near Ghana. |

**Budget posture:** near-zero early burn — Supabase free tier, Vercel/Netlify free tiers, cheap backend host, free `wa.me` follow-up. Only paid messaging (phone OTP) deferred.

**iOS PWA caveat:** camera QR works iOS Safari + Android Chrome over HTTPS. Do NOT rely on web push on iOS — post-event nudge via WhatsApp + email.

## 3. Data model (Supabase / PostgreSQL)

Rule: account-level identity; base profile separate from per-event participation; goals never on the account.

| Table | Key columns |
|---|---|
| `account` | id (uuid, pk), created_at, status. One per human. |
| `identifier` | id, account_id (fk), type (`phone`\|`email`), value (unique, normalised), verified_at. Two rows/account. `UNIQUE(type,value)` = dedup. Email verified at signup; phone verified_at null until post-pilot. |
| `profile` | account_id (fk, pk), full_name, photo_url, job_title, company, linkedin_url. Base card, reused every event. |
| `event` | id, organizer_id (fk), name, city, starts_at, ends_at, slug, join_link, status. |
| `participation` | id, account_id (fk), event_id (fk), goals (text[]), created_at. `UNIQUE(account_id,event_id)`. Goals reset per event. |
| `connection` | id, event_id, from_account, to_account, intent (enum), created_at, note (text), hot (bool), followed_up (bool). |
| `organizer` | id, name, contact_email, created_at. Org users log in via email OTP + role flag. |
| `sponsor` | id, event_id, name, tier, booth_code. |
| `sponsor_lead` | id, sponsor_id, account_id, event_id, intent, score, created_at. |

**Intent enum:** `partnership | customer | investment | talent | general`.

## 4. API surface (REST)

### Auth & identity
```
POST /auth/request-otp   { identifier, channel }   → email OTP (phone OTP post-pilot)
POST /auth/verify-otp    { identifier, code }       → { token, isNewUser }
POST /auth/handoff       { signedToken }            → verify pre-fill, create/link account
POST /auth/refresh       (cookie)                   → new access token
```
### Profile & participation
```
GET  /me                                    → account + base profile
PUT  /me/profile         { name, title, company, photo, linkedin }
POST /events/:id/join    { goals[] }         → creates participation
GET  /events/:id/me                          → my participation + goals
```
### Networking
```
GET  /events/:id/discover                    → rules-based "people you should meet"
POST /events/:id/connect { toProfileToken, intent }
GET  /events/:id/connections                 → my contacts + notes
PUT  /connections/:id    { note, hot, followed_up }
```
### Organizer & sponsor
```
GET  /org/events/:id/intelligence                → dashboard metrics + intent breakdown
GET  /org/events/:id/sponsors/:sid/report        → sponsor ROI / lead report
POST /events/:id/sponsor-scan { boothCode, intent } → sponsor_lead
```

## 5. Key flows

### 5.1 Registration handoff (signed pre-fill)
1. Organizer server builds `{name, phone, email, event_id, exp}`, signs it (HMAC-SHA256 or short-lived JWT).
2. Attendee clicks "Complete your networking profile" → Rally with `?t=<signedToken>`.
3. Rally verifies signature + expiry server-side. Never trust unsigned query data.
4. If email/phone matches an account → returning user. Else → create account, pre-fill, send ONE email OTP.

### 5.2 OTP login (email-first)
- Primary: email OTP / magic link via Supabase Auth (free).
- Phone: stored for free `wa.me` follow-up; phone OTP verification post-pilot.

### 5.3 Scan → connect → intent → follow-up
- QR encodes a signed, rotating profile token (not a raw id).
- Scanner reads token → `POST /connect` with intent → creates connection + (if counterparty is sponsor/booth) a sponsor_lead.
- WhatsApp follow-up = free deep link `https://wa.me/<number>?text=<prefilled>`.

## 6. Security
- Signed handoff only — HMAC/JWT verified server-side, short expiry, one-time use.
- OTP hardening — rate-limit per identifier + IP, 5-min expiry, max attempts, hashed codes.
- QR tokens rotate & are signed.
- Supabase Row-Level Security scopes attendee data; organizer/sponsor reads per-event only.
- Known pilot trade-off: phones unverified in pilot (email verified). Acceptable for validation; tighten with phone OTP once revenue starts. Add a basic consent notice at signup.

## 7. Rules-based matching (V1)
- No ML. Map "looking for" goals to "offers".
- Score each attendee: +weight when their offer matches my goal and my offer matches their goal (two-way). Rank desc, show top N with plain-language "why".
- Cheap, explainable; seeds data for V2 AI matchmaking.

## 8. 8-week sprint

| Week | Build | Ships |
|---|---|---|
| 1 | Repo, CI, Supabase schema/migrations, email-OTP auth, account+identifier+dedup | Log in by email; dedup works |
| 2 | Base profile CRUD + photo; event + participation; join with per-event goals | Profile; join event; goals per event |
| 3 | QR generate + scanner; connect endpoint; connections list | Two phones scan & connect |
| 4 | Intent capture; notes; hot flag; `wa.me` follow-up | Scan → intent → note → WhatsApp |
| 5 | Rules-based discover; returning-user "welcome back" | Matched directory; 2nd-event login |
| 6 | Organizer dashboard (metrics + intent); sponsor lead capture + report | Organizer & sponsor views |
| 7 | Signed handoff; PWA polish (offline, install, low-data); post-event nudge | Pre-fill link; installable app |
| 8 | Hardening: RLS, rate limits, load test, bug bash, dry-run ~20 users | Pilot-ready |

## 9. Remaining decisions before week 1
- Hosting region closest to Ghana (backend + Supabase project).
- Supabase tier headroom vs expected pilot volume (~$25/mo Pro as buffer for a large event).
- Phone OTP provider (post-pilot): Meta WhatsApp Business API needs business account + template approval (lead time); Africa's Talking / Twilio SMS fallback.
- Prisma vs Supabase client.
