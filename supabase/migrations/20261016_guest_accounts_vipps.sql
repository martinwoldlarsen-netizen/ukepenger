-- Besteforeldre kan koble lenken sin til en egen konto, så de finner tilbake
-- på ny telefon/PC. En slik konto har ingen profil (er ikke forelder), bare
-- én eller flere rader i family_guests med user_id satt.
alter table public.family_guests
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists family_guests_user_idx on public.family_guests (user_id) where user_id is not null;

-- Foreldre kan legge inn navn og Vipps-nummer, så besteforeldre kan velge
-- hvem gaven skal sendes til. Appen flytter aldri penger selv.
alter table public.profiles
  add column if not exists display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  add column if not exists vipps_phone text check (vipps_phone is null or vipps_phone ~ '^[0-9]{8}$');
