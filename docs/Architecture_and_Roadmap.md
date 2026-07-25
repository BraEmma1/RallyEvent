# Rally — Product Architecture & Roadmap

> Relationship intelligence platform for the events economy.
> The "why" behind the rules in `CLAUDE.md`. Read alongside the Technical Build Spec.

## 1. The reframe

Rally is not a digital business card and not an event-analytics tool. It is a **relationship intelligence platform** that owns three moments around every event:

- **Before:** "I know who I should meet."
- **During:** "I can capture every valuable connection."
- **After:** "I can convert those connections into opportunities."

Positioning is fixed: to organizers we sell **Event Relationship Intelligence** (not "event analytics" — that invites comparison to Eventbrite/Cvent). We do not lead with "cost saving"; we lead with **"we increase the value generated from the money already spent"** — happier attendees, happier sponsors, stronger sponsorship renewals.

## 2. Account & identity model (MVP-critical)

Foundational decisions — cheap now, expensive to retrofit. Build from the first commit.

### 2.1 One person, one account, across all events
An attendee registers once. At a second Rally-powered event they do NOT re-register — they log in and join. The account persists; only the event participation is new.

### 2.2 Dual identifier: phone AND email
- Collect BOTH at first registration.
- Either can log in (enter phone or email → one-time code → same account).
- Both are unique keys pointing to the SAME internal account id. **This prevents duplicate accounts** — the failure where someone registers by phone at event 1, logs in by email at event 2, and the system forks them into two profiles.
- On any new registration, check phone AND email against existing accounts; if either matches, recognise the returning user.
- **Budget note:** email is verified at signup (free via Supabase). Phone is stored for free `wa.me` follow-up; **phone OTP verification is deferred to post-pilot** to avoid SMS/WhatsApp-API cost.

### 2.3 Base profile vs per-event context

| Layer | Holds |
|---|---|
| **Base profile** (persists forever) | Name, photo, job title, company, contact links. Tied to the account. Reused every event. |
| **Per-event participation** (new each event) | What the person is looking for AT THIS EVENT (goals reset per event), connections, notes, intent tags. |

Goals change per event — partners at a fintech summit, talent at a hiring fair — but identity stays the same. This gives seamless "log in and continue" while keeping each event's data clean, and sets up cross-event features later for free.

## 3. Onboarding & registration handoff

### 3.1 Two supported paths (pilot)
- **Rally-hosted registration (default).** Organizer shares one event link; attendee registers directly in Rally. Zero integration.
- **Signed pre-fill handoff (optional).** Organizer adds a "Complete your networking profile" button passing name/phone/email to Rally via a **signed** link. Attendee lands pre-filled and confirms. One standard mechanism, not custom per organizer.
- **Deferred to V2:** deep embedding into each organizer's bespoke registration system.

### 3.2 Security (non-negotiable)
- Never trust identity data in a plain URL — the handoff payload must be cryptographically signed and verified server-side.
- On first account creation via handoff, still do ONE lightweight OTP verification (email in pilot).
- Reason: we sell this data to sponsors as qualified leads. Data integrity is the product.

## 4. Connection intent & matching

### 4.1 Intent capture (IN the MVP)
At the moment two people connect, one tap: "Why are you connecting?" — Partnership / Customer / Investment / Talent / General. Trivial to build; converts a raw contact into a **qualified, intent-scored lead** — what sponsors pay for — and powers organizer intelligence.

### 4.2 "People you should meet" (rules-based in MVP)
Rules-based matching on structured goals already collected: "N people here are looking for what you offer / offer what you want." No AI. Delivers most of the "I know who to meet" value and seeds data for V2 AI matchmaking.

**Deferred to V2:** AI matchmaking that learns from behaviour and cross-event history — cannot work at the first pilot (cold-start; needs the data the first events generate).

## 5. Roadmap

| Phase | Scope | Rationale |
|---|---|---|
| **V1 — MVP (pilot)** | Phone+email accounts · cross-event login · base/per-event profile · QR exchange · intent capture · notes · WhatsApp follow-up · post-event nudge · rules-based "who to meet" · organizer relationship-intelligence dashboard · sponsor lead capture · signed pre-fill handoff | Proves the three moments work at all. Thin, ~8 weeks. |
| **V2 — After validation** | AI matchmaking · pre-event "20 people you should meet" · richer sponsor lead-capture forms · cross-event professional network · LinkedIn login/auto-fill · deep embedded registration integrations | Needs real usage data and/or heavier engineering. One at a time. |
| **V3 — Platform** | Ticketing & CRM integrations · virtual/hybrid networking · community management between events · cross-event organizer analytics · partnership pipeline | The "operating system for African business events." Built on real users + data. |

## 6. The one guardrail

Freda's vision is right and all banked above. But the pilot's job is to **prove the three moments, not ship the whole platform.** Every feature added to V1 is a week not spent piloting and a thing that can break in front of the three paying organizers. New ideas default to V2/V3 — they earn into the MVP only if they are both cheap AND directly strengthen exchange, follow-up, or sponsor lead value.

## 7. Immediate build decisions
- Accounts are account-level, not event-level, from commit one.
- Phone + email both collected; both unique keys to one account id; dedup on registration. (Email verified in pilot; phone OTP later.)
- Separate base-profile table from per-event-participation table.
- Registration handoff via signed token only; one OTP verification on first creation.
- Intent field captured at connection time; feeds sponsor + organizer views.
- PWA; WhatsApp-first follow-up (`wa.me`); low-data friendly.
