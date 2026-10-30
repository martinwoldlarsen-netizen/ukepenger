-- Egen enhet for ett barn (f.eks. barnets egen telefon). En QR-kode kan lages
-- for ett bestemt barn; enheten som skanner den, ser bare det barnet. Bindingen
-- ligger på serveren (devices.child_id), ikke i en egen cookie per barn.
-- Tom child_id = felles enhet der barna velger profil som før.
-- Slettes barnet, slettes også enheten (den skal aldri bli en felles enhet).
alter table public.device_pairings
  add column if not exists child_id uuid references public.children(id) on delete cascade;
alter table public.devices
  add column if not exists child_id uuid references public.children(id) on delete cascade;
create index if not exists devices_child_idx on public.devices (child_id);
create index if not exists device_pairings_child_idx on public.device_pairings (child_id);
