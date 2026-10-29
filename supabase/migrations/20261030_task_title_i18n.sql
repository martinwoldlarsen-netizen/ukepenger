-- Oppgavens navn på andre språk, skrevet av forelderen, f.eks.
-- {"en": "Tidy your room", "uk": "Прибрати в кімнаті"}. Barnet ser navnet på
-- sitt språk (children.language). Tom = kjente forslag oversettes automatisk,
-- ellers vises navnet slik det er skrevet (tasks.title).
alter table public.tasks
  add column if not exists title_i18n jsonb
  check (title_i18n is null or (jsonb_typeof(title_i18n) = 'object' and octet_length(title_i18n::text) <= 1000));
