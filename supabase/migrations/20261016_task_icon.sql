-- Forelderen kan velge bilde for en oppgave selv: navnet på en tegnet
-- illustrasjon (components/task-art.tsx) eller en emoji. Tom = gjettes ut fra navnet.
alter table public.tasks
  add column if not exists icon text check (icon is null or char_length(icon) between 1 and 40);
