-- Varsler til foreldre (web-push). Én rad per enhet/nettleser som har slått på varsler.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_family_idx on public.push_subscriptions (family_id);

alter table public.push_subscriptions enable row level security;

-- Bare serveren (service role) leser og skriver; API-ruten sjekker innlogging.
revoke all on public.push_subscriptions from anon, authenticated;

-- Nøkler serveren lager selv (f.eks. VAPID for varsler). Bare service role.
create table if not exists public.app_secrets (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
