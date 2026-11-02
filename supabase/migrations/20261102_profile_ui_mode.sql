-- Hvor mye foreldredelen viser, valgt per forelder (Innstillinger → Visning):
-- simple = Enkel, normal = Vanlig (som før), full = Alt. Styrer bare hva som
-- vises, ikke hva som gjelder. Nye familier starter på Enkel (settes i appen).
alter table public.profiles
  add column if not exists ui_mode text not null default 'normal' check (ui_mode in ('simple', 'normal', 'full'));
