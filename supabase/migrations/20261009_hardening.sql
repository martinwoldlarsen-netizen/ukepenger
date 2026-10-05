-- Opprydding etter gjennomgang (5. okt 2026).

-- 1) Milepælsbonus: bruk kravets plass i rekkefølgen, ikke totalen. Ellers
--    hoppes bonusen over når "Godkjenn alle" passerer en milepæl, fordi alle
--    radene i samme oppdatering ser den samme totalen.
create or replace function public.claims_milestone_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_count integer;
  v_amount integer;
  v_claim uuid;
begin
  if new.task_id is null or new.status <> 'APPROVED' then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.status in ('APPROVED', 'PAID') then
    return null;
  end if;
  select count(*) into v_count from claims
  where child_id = new.child_id and task_id is not null and status in ('APPROVED', 'PAID')
    and (coalesce(decided_at, created_at), id) <= (coalesce(new.decided_at, new.created_at), new.id);
  select coalesce((milestone_bonus_ore ->> v_count::text)::integer, 0) into v_amount
  from families where id = new.family_id;
  if coalesce(v_amount, 0) <= 0 then
    return null;
  end if;
  insert into milestone_bonuses (child_id, milestone) values (new.child_id, v_count)
  on conflict do nothing;
  if not found then
    return null;
  end if;
  insert into claims (family_id, child_id, task_id, amount_ore, status, note, decided_at)
  values (new.family_id, new.child_id, null, least(v_amount, 100000), 'APPROVED', '🏅 Bonus for ' || v_count || ' oppgaver', now())
  returning id into v_claim;
  update milestone_bonuses set claim_id = v_claim where child_id = new.child_id and milestone = v_count;
  return null;
end;
$fn$;
revoke execute on function public.claims_milestone_bonus() from public, anon, authenticated;

-- 2) Ukepenger: lås og behandle bare barn som faktisk skal ha penger nå.
--    Funksjonen kalles hver gang barnesiden lastes, så de fleste kall gjør nå
--    ingenting i stedet for å låse alle barna.
create or replace function public.ensure_weekly_allowances(p_family_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  c record;
  v_today date := (now() at time zone 'Europe/Oslo')::date;
  v_last date;
  v_next date;
  v_paid date;
  v_added integer := 0;
  v_rounds integer;
begin
  if auth.uid() is not null and not exists (
    select 1 from profiles where user_id = auth.uid() and family_id = p_family_id
  ) then
    raise exception 'NOT_ALLOWED';
  end if;

  for c in
    select * from children
    where family_id = p_family_id and active and weekly_allowance_ore > 0
      and (allowance_paid_through is null
           or allowance_paid_through + 7 <= v_today - ((extract(isodow from v_today)::int - allowance_weekday + 7) % 7))
    for update
  loop
    v_last := v_today - ((extract(isodow from v_today)::int - c.allowance_weekday + 7) % 7);
    v_paid := c.allowance_paid_through;
    if v_paid is null then
      v_paid := case when v_last = v_today then v_last - 7 else v_last end;
      update children set allowance_paid_through = v_paid where id = c.id;
    end if;

    v_next := v_paid + 7;
    v_rounds := 0;
    if v_last - v_next > 7 * 8 then
      v_next := v_last - 7 * 7;
    end if;
    while v_next <= v_last and v_rounds < 8 loop
      insert into claims (family_id, child_id, task_id, amount_ore, status, note, created_at, decided_at)
      values (p_family_id, c.id, null, c.weekly_allowance_ore, 'APPROVED', '📅 Ukepenger',
              (v_next::timestamp + time '08:00') at time zone 'Europe/Oslo',
              (v_next::timestamp + time '08:00') at time zone 'Europe/Oslo');
      v_added := v_added + 1;
      v_rounds := v_rounds + 1;
      v_next := v_next + 7;
    end loop;
    if v_next - 7 > v_paid then
      update children set allowance_paid_through = v_next - 7 where id = c.id;
    end if;
  end loop;

  return v_added;
end;
$fn$;
revoke all on function public.ensure_weekly_allowances(uuid) from public, anon;
grant execute on function public.ensure_weekly_allowances(uuid) to authenticated, service_role;

-- 3) Indekser på fremmednøkler som brukes i oppslag og ved sletting.
create index if not exists claims_task_id_idx on public.claims (task_id);
create index if not exists claims_child_status_idx on public.claims (child_id, status);
create index if not exists payments_family_id_idx on public.payments (family_id);
create index if not exists payments_child_id_idx on public.payments (child_id);
create index if not exists profiles_family_id_idx on public.profiles (family_id);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
create index if not exists milestone_bonuses_claim_id_idx on public.milestone_bonuses (claim_id);
create index if not exists child_task_settings_task_id_idx on public.child_task_settings (task_id);
create index if not exists payment_claims_claim_id_idx on public.payment_claims (claim_id);
create index if not exists wishlist_items_payment_id_idx on public.wishlist_items (payment_id);
create index if not exists family_invites_invited_by_idx on public.family_invites (invited_by);

-- 4) RLS: auth.uid() i (select ...) så den regnes ut én gang per spørring.
alter policy "families: insert members" on public.families
  with check (((select auth.uid()) IS NOT NULL) AND ((NOT (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.family_id IS NOT NULL))))) OR (id IN ( SELECT profiles.family_id FROM profiles WHERE (profiles.user_id = (select auth.uid()))))));
alter policy child_qr_codes_all_family on public.child_qr_codes
  using (EXISTS ( SELECT 1 FROM (children c JOIN profiles p ON ((p.family_id = c.family_id))) WHERE ((p.user_id = (select auth.uid())) AND (c.id = child_qr_codes.child_id))))
  with check (EXISTS ( SELECT 1 FROM (children c JOIN profiles p ON ((p.family_id = c.family_id))) WHERE ((p.user_id = (select auth.uid())) AND (c.id = child_qr_codes.child_id))));
