# Supabase setup checklist (Rally pilot)

Do this before Prompt 1. Takes ~15 minutes. Free tier is fine for the pilot.

## 1. Create the project
- [ ] Sign up at supabase.com, create a new project.
- [ ] Pick the **region closest to Ghana** (e.g. EU West / London) for latency.
- [ ] Set a strong database password; save it in your password manager.
- [ ] Note the free-tier limits (rows, storage, monthly active users, bandwidth). Budget the ~$25/mo Pro tier only if a large event is booked.

## 2. Grab the keys → put in `.env`
From Project Settings → API and Database:
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY` (public/anon)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server only — never ship to the browser)
- [ ] `DATABASE_URL` (connection string, for Prisma if used)

## 3. Auth
- [ ] Enable **Email** auth (magic link / OTP). This is the pilot's primary login — free.
- [ ] Leave **Phone** auth OFF for now (deferred post-pilot to avoid SMS cost).
- [ ] Set the Site URL + redirect URLs to your local (`http://localhost:5173`) and later your deployed frontend.

## 4. Storage
- [ ] Create a **`profile-photos`** bucket (public read, authenticated write).
- [ ] Plan to compress images client-side before upload.

## 5. Database
- [ ] Let Claude Code generate the schema + migrations (Prompt 1) for: `account`, `identifier`, `profile`, `event`, `participation`, `connection`, `organizer`, `sponsor`, `sponsor_lead`.
- [ ] Confirm `identifier` has `UNIQUE(type, value)` — this is what enforces account dedup.
- [ ] Confirm `participation` has `UNIQUE(account_id, event_id)`.

## 6. Row-Level Security (before pilot, not day 1)
- [ ] Turn on RLS for all tables.
- [ ] Attendees can read/write only their own account, profile, participations, connections.
- [ ] Organizers/sponsors can read aggregate data only for their own event.
- [ ] Test policies with a non-admin token before going live.

## 7. Sanity check
- [ ] Insert a test account with a phone + email identifier; try to insert a duplicate email → should be rejected by the unique constraint.
- [ ] Confirm email OTP login works end to end locally.

> When these boxes are checked, you're ready to run Prompt 1 in Claude Code.
