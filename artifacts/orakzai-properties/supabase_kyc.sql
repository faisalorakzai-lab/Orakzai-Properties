-- OkzByte KYC schema and secure document storage
-- Idempotent migration for the existing Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  supabase_user_id uuid,
  full_name text,
  email text,
  kyc_status text not null default 'not_started' check (kyc_status in ('not_started','in_progress','pending_review','approved','rejected')),
  kyc_submitted_at timestamptz,
  kyc_reviewed_at timestamptz,
  kyc_rejection_reason text,
  father_name text,
  cnic text,
  dob date,
  phone text,
  address text,
  city text,
  country text,
  occupation text,
  source_of_funds text,
  doc_type text,
  address_doc_type text,
  document_urls jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists supabase_user_id uuid;
alter table public.profiles add column if not exists document_urls jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_supabase_user_id_idx on public.profiles(supabase_user_id);
create index if not exists profiles_kyc_status_idx on public.profiles(kyc_status);
create index if not exists profiles_kyc_submitted_at_idx on public.profiles(kyc_submitted_at desc);

-- The existing production bucket is `verification-documents`; storage.objects is Supabase-managed.
-- Its object policies must be managed from Storage policies or an owner-capable migration.

alter table public.profiles enable row level security;

 drop policy if exists profiles_owner_select on public.profiles;
 drop policy if exists profiles_owner_insert on public.profiles;
 drop policy if exists profiles_owner_update on public.profiles;

create policy profiles_owner_select on public.profiles
for select to authenticated
using (supabase_user_id = auth.uid());

create policy profiles_owner_insert on public.profiles
for insert to authenticated
with check (supabase_user_id = auth.uid());

create policy profiles_owner_update on public.profiles
for update to authenticated
using (supabase_user_id = auth.uid())
with check (supabase_user_id = auth.uid());

-- Do not alter storage.objects here: Supabase owns that table. The app uses the existing
-- private `verification-documents` bucket and its existing Storage policy configuration.

create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_profiles_updated_at();

-- Realtime is not required for the initial KYC write, but keeps admin sync ready.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';
