-- Vipps-mottakere for gaver, per familie. Én forelder kan legge inn både
-- seg selv og den andre (f.eks. «Mamma» og «Pappa»), også om den andre ikke
-- har konto. Erstatter profiles.display_name/vipps_phone for gaver.
create table if not exists public.family_vipps (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  phone text not null check (phone ~ '^[0-9]{8}$'),
  created_at timestamptz not null default now()
);

create index if not exists family_vipps_family_idx on public.family_vipps (family_id);

alter table public.family_vipps enable row level security;
revoke all on public.family_vipps from anon;

create policy "family_vipps: select family members" on public.family_vipps for select to authenticated
  using (family_id in (select p.family_id from profiles p where p.user_id = (select auth.uid())));
create policy "family_vipps: insert family members" on public.family_vipps for insert to authenticated
  with check (family_id in (select p.family_id from profiles p where p.user_id = (select auth.uid())));
create policy "family_vipps: update family members" on public.family_vipps for update to authenticated
  using (family_id in (select p.family_id from profiles p where p.user_id = (select auth.uid())))
  with check (family_id in (select p.family_id from profiles p where p.user_id = (select auth.uid())));
create policy "family_vipps: delete family members" on public.family_vipps for delete to authenticated
  using (family_id in (select p.family_id from profiles p where p.user_id = (select auth.uid())));
