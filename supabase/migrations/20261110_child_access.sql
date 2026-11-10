-- Tilgang per barn på barnesiden:
--   shared_visible   false = vises ikke på felles enheter (bare på barnets egen enhet)
--   pin_hash         valgfri 4-sifret kode (scrypt, satt av forelderen via /api/admin/children/pin)
--   pin_fails / pin_locked_until  sperre etter for mange feil forsøk
-- Koden sjekkes på serveren i hvert kiosk-API (lib/kid-access.ts).
alter table public.children
  add column if not exists shared_visible boolean not null default true,
  add column if not exists pin_hash text,
  add column if not exists pin_fails integer not null default 0,
  add column if not exists pin_locked_until timestamptz;
