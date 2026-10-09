-- Kontaktskjema på /kontakt. Bare serveren leser og skriver (service role);
-- eieren ser meldingene i /admin/eier.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text check (name is null or char_length(name) <= 80),
  email text not null check (char_length(email) between 3 and 200),
  topic text not null default 'sporsmal' check (topic in ('sporsmal', 'personvern', 'feil', 'annet')),
  message text not null check (char_length(message) between 2 and 3000),
  sender_hash text,
  handled_at timestamptz
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
