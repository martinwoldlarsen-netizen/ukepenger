-- Hvem som eier tjenesten og får se eier-oversikten (/admin/eier).
-- Bare serveren (service role) leser tabellen.
create table if not exists public.app_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_owners enable row level security;
revoke all on public.app_owners from anon, authenticated;

-- Eieren legges inn med user_id (gjøres i Supabase, ikke i koden).
