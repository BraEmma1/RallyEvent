-- Rally — Sprint Week 1 schema: account-level identity + dual-identifier dedup.
-- Creates account, identifier, profile ONLY. No event/participation/connection/
-- sponsor tables yet. RLS is deferred to the hardening sprint (see SUPABASE_SETUP.md).
--
-- gen_random_uuid() is built into Postgres 13+ (Supabase and PGlite both ship it),
-- so no pgcrypto extension is required.

-- account: one row per human, persists across all events.
create table if not exists account (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  status      text not null default 'active'
);

-- identifier: dual identifier (phone|email). UNIQUE(type, value) is what enforces
-- account dedup — do not remove it. Values are stored already-normalised by the
-- application (emails lowercased/trimmed, phones in E.164).
create table if not exists identifier (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references account (id) on delete cascade,
  type        text not null check (type in ('phone', 'email')),
  value       text not null,
  verified_at timestamptz,
  created_at  timestamptz not null default now(),
  -- the dedup constraint
  constraint identifier_type_value_key unique (type, value),
  -- defense in depth: never let a non-normalised email persist
  constraint identifier_email_is_lowercase check (type <> 'email' or value = lower(value))
);

-- lookups by raw value (dedup checks) and by owning account
create index if not exists identifier_value_idx on identifier (value);
create index if not exists identifier_account_id_idx on identifier (account_id);

-- profile: base card, 1:1 with account, reused every event. Created now so the
-- FK/shape is locked in; all content fields nullable (no profile UI this slice).
create table if not exists profile (
  account_id   uuid primary key references account (id) on delete cascade,
  full_name    text,
  photo_url    text,
  job_title    text,
  company      text,
  linkedin_url text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
