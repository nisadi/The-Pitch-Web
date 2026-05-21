-- Single admin users table: public.role
create extension if not exists "pgcrypto";

create table if not exists public.role (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'manager', 'staff')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  password text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_email_unique unique (email)
);

create index if not exists role_email_idx on public.role (email);
create index if not exists role_status_idx on public.role (status);

alter table public.role enable row level security;

create policy "Authenticated read role table"
  on public.role for select
  to authenticated
  using (true);
