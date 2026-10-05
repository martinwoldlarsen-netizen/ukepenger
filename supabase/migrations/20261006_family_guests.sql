-- Besteforeldre (og andre gjester) uten innlogging: en personlig lenke gir en
-- langvarig, httpOnly-cookie som bare gir tilgang til en egen, begrenset side
-- (se barnebarna, ønskene deres og gi gaver). Kun hash av hemmeligheten
-- lagres. Tabellen leses/skrives bare av serveren (service role); RLS er på
-- uten policyer, så vanlige innlogginger kommer ikke til den direkte.

create table if not exists public.family_guests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  secret_hash text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

create index if not exists family_guests_family_idx on public.family_guests (family_id);

alter table public.family_guests enable row level security;
revoke all on public.family_guests from anon, authenticated;
