-- Run this migration in the linked Supabase project's SQL editor.
-- The client intentionally fails closed if these tables are not installed.

create extension if not exists pgcrypto;

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a text not null,
  participant_b text not null,
  participant_a_name text,
  participant_b_name text,
  subject text,
  context jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id text not null,
  body text not null,
  message_type text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.legal_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  matter_type text not null,
  location text not null,
  brief text not null,
  status text not null default 'new' check (status in ('new','reviewing','assigned','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_threads_participant_a_idx on public.chat_threads(participant_a);
create index if not exists chat_threads_participant_b_idx on public.chat_threads(participant_b);
create index if not exists chat_messages_thread_id_idx on public.chat_messages(thread_id, created_at);
create index if not exists legal_briefs_user_id_idx on public.legal_briefs(user_id, created_at);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.legal_briefs enable row level security;

-- The existing Clerk identity is passed as text. These policies are intentionally
-- conservative and should be adapted to the project's server-side auth bridge.
-- No public anonymous insert/select policy is created here.

comment on table public.chat_threads is 'Real user-to-counsel consultation threads; participant_b is a verified directory record key until counsel onboarding supplies a user account.';
comment on table public.legal_briefs is 'User-submitted property legal briefs for manual counsel matching.';
