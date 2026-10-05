-- Engangs-QR for barneenheter: en QR-kode inneholder et tilfeldig token som
-- virker i 10 minutter og bare én gang. Hver enhet som kobles til får sin egen
-- rad i devices med sin egen hemmelighet (bare hashen lagres i token_hash), så
-- foreldre kan fjerne én enhet uten å påvirke de andre.
create table if not exists public.device_pairings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  device_id uuid references public.devices(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists device_pairings_family_idx on public.device_pairings (family_id);
create index if not exists device_pairings_device_idx on public.device_pairings (device_id);
create index if not exists device_pairings_created_by_idx on public.device_pairings (created_by);
alter table public.device_pairings enable row level security;
revoke all on public.device_pairings from anon, authenticated;
