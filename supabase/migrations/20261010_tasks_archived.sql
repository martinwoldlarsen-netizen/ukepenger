-- «Slett oppgave» arkiverer i stedet for å slette. En ekte sletting ville
-- (via on delete cascade) også slettet alle krav og barnas historikk/penger.
alter table public.tasks add column if not exists archived_at timestamptz;
