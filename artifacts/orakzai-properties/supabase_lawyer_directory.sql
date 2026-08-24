-- OkzByte lawyer consultation chat migration
-- Run this script in the linked Supabase project's SQL Editor.
-- The public directory keeps lawyer IDs in context; user ownership is enforced by auth.uid().

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

-- Recreate only this feature's policies so the script is safe to re-run.
drop policy if exists chat_threads_select_own on public.chat_threads;
drop policy if exists chat_threads_insert_own on public.chat_threads;
drop policy if exists chat_threads_update_own on public.chat_threads;
drop policy if exists chat_messages_select_own_thread on public.chat_messages;
drop policy if exists chat_messages_insert_own_thread on public.chat_messages;
drop policy if exists chat_messages_update_own on public.chat_messages;
drop policy if exists chat_messages_delete_own on public.chat_messages;
drop policy if exists legal_briefs_select_own on public.legal_briefs;
drop policy if exists legal_briefs_insert_own on public.legal_briefs;
drop policy if exists legal_briefs_update_own on public.legal_briefs;

create policy chat_threads_select_own on public.chat_threads
  for select to authenticated
  using (participant_a = auth.uid()::text or participant_b = auth.uid()::text);

create policy chat_threads_insert_own on public.chat_threads
  for insert to authenticated
  with check (participant_a = auth.uid()::text or participant_b = auth.uid()::text);

create policy chat_threads_update_own on public.chat_threads
  for update to authenticated
  using (participant_a = auth.uid()::text or participant_b = auth.uid()::text)
  with check (participant_a = auth.uid()::text or participant_b = auth.uid()::text);

create policy chat_messages_select_own_thread on public.chat_messages
  for select to authenticated
  using (exists (
    select 1 from public.chat_threads t
    where t.id = chat_messages.thread_id
      and (t.participant_a = auth.uid()::text or t.participant_b = auth.uid()::text)
  ));

create policy chat_messages_insert_own_thread on public.chat_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()::text
    and exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (t.participant_a = auth.uid()::text or t.participant_b = auth.uid()::text)
    )
  );

create policy chat_messages_update_own on public.chat_messages
  for update to authenticated
  using (sender_id = auth.uid()::text)
  with check (sender_id = auth.uid()::text);

create policy chat_messages_delete_own on public.chat_messages
  for delete to authenticated
  using (sender_id = auth.uid()::text);

create policy legal_briefs_select_own on public.legal_briefs
  for select to authenticated
  using (user_id = auth.uid()::text);

create policy legal_briefs_insert_own on public.legal_briefs
  for insert to authenticated
  with check (user_id = auth.uid()::text);

create policy legal_briefs_update_own on public.legal_briefs
  for update to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Enable Postgres Changes for the realtime chat room, without failing on re-runs.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_threads') then
      execute 'alter publication supabase_realtime add table public.chat_threads';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
      execute 'alter publication supabase_realtime add table public.chat_messages';
    end if;
  end if;
end $$;

comment on table public.chat_threads is 'Real user-to-counsel consultation threads. participant_a is the Supabase auth user; participant_b is a verified directory record key until counsel onboarding supplies an account.';
comment on table public.legal_briefs is 'User-submitted property legal briefs for manual counsel matching.';
