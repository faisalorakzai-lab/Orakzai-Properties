create table if not exists public.mortgage_applications (
  application_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  employment_type text not null,
  monthly_income numeric not null check (monthly_income >= 0),
  desired_loan_amount numeric not null check (desired_loan_amount >= 0),
  document_urls text[] not null default '{}',
  status text not null default 'Under Review' check (status in ('Under Review','In Assessment','Approved','Declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mortgage_applications enable row level security;
drop policy if exists "mortgage applications owner insert" on public.mortgage_applications;
drop policy if exists "mortgage applications owner select" on public.mortgage_applications;
create policy "mortgage applications owner insert" on public.mortgage_applications for insert to authenticated with check (user_id = auth.uid());
create policy "mortgage applications owner select" on public.mortgage_applications for select to authenticated using (user_id = auth.uid());
create index if not exists mortgage_applications_user_created_idx on public.mortgage_applications(user_id, created_at desc);
