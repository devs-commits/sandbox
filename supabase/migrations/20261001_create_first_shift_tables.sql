-- First Shift is intentionally isolated from existing product tables.
-- The flag is OFF when no first_shift_enabled row exists, and also defaults
-- to OFF if a row is created without an explicit rollout mode. Moving to
-- EVERYONE requires an explicit mode = 'everyone' update.

create table public.feature_flags (
  key text primary key,
  mode text not null default 'off' check (mode in ('off', 'allowlist', 'everyone')),
  allowlist_emails text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.first_shift_sessions (
  id uuid primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'in_progress',
  current_step integer not null default 0,
  replay_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  skipped_at timestamptz,
  last_exited_at timestamptz,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.first_shift_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.first_shift_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  step integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;
alter table public.first_shift_sessions enable row level security;
alter table public.first_shift_events enable row level security;

create policy "Users can read their own First Shift session"
  on public.first_shift_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Sessions, feature_flags, and first_shift_events deliberately have no
-- client write policies. The First Shift server route is the only writer,
-- using the service-role client. Users may only read their own session.
