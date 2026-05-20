-- -------------------------------------------------------------
-- 1. SETUP PROFILES TABLE AND TRIGGER (FOR NEW SIGNUPS)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  email text,
  phone_number text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Drop existing policies if they exist to avoid duplication errors
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can update their own profile." on public.profiles;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Auto-sync auth.users to public.profiles trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone_number, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- -------------------------------------------------------------
-- 2. SETUP CONTACT_MESSAGES TABLE AND RLS POLICIES
-- -------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  phone text,
  location text,
  reference_code text,
  status text default 'new' constraint contact_messages_status_check check (status in ('new', 'resolved', 'closed')),
  thread_key text,
  replies jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.contact_messages enable row level security;

drop policy if exists "Allow public submissions to contact_messages" on public.contact_messages;
create policy "Allow public submissions to contact_messages"
  on public.contact_messages for insert
  to anon, authenticated
  with check ( true );


-- -------------------------------------------------------------
-- 3. SETUP BOOKINGS RLS POLICIES (FIXING "violates row-level security")
-- -------------------------------------------------------------
alter table public.bookings enable row level security;

drop policy if exists "Allow authenticated users to insert bookings" on public.bookings;
create policy "Allow authenticated users to insert bookings"
  on public.bookings for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "Allow users to read their own bookings" on public.bookings;
create policy "Allow users to read their own bookings"
  on public.bookings for select
  to authenticated
  using ( auth.uid() = user_id );


-- -------------------------------------------------------------
-- 4. SEED GALLERY IMAGES (IF EMPTY)
-- -------------------------------------------------------------
-- This will populate the empty gallery table so photos show up on the frontend
insert into public.gallery (image_url, title, category, is_active)
values 
  ('/images/facility-courts.png', 'Main Arena Pitch A', 'Ground', true),
  ('/images/hero-stadium.png', 'The Fuel Station', 'Cafe', true),
  ('/images/facility-courts.png', 'Championship Parties', 'Events', true),
  ('/images/hero-stadium.png', 'The Junior Zone', 'Kids Area', true),
  ('/images/facility-courts.png', 'Corporate Lounges', 'Events', true),
  ('/images/hero-stadium.png', 'Vantage Seating', 'Ground', true)
on conflict do nothing;
