-- Kategori på oppgaver (f.eks. "huset", "kjokken"), så Oppgaver-siden kan
-- gruppere dem. Null = gjettes ut fra navnet i appen (lib/task-packs.ts).
alter table public.tasks add column if not exists category text;
