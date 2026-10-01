-- Ønsker barnet skriver inn selv ("Hus i Toca Boca"), med valgfri
-- prisgjetning. Ønsket havner i forelderens Krav-liste. Godkjent:
--   * har barnet nok "Til gode" -> utbetales med en gang som et ønske
--     (payments.method = 'WISH', note = ønsket), og beløpet trekkes fra saldoen
--   * ellers -> blir et sparemål (ACTIVE) til barnet har spart nok
--
-- Additivt: eksisterende ønsker blir ACTIVE/PARENT og oppfører seg som før.

alter table public.wishlist_items
  add column if not exists status text not null default 'ACTIVE',
  add column if not exists created_by text not null default 'PARENT',
  add column if not exists suggested_ore integer,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_id uuid references public.payments(id) on delete set null;

-- Et forslag har ingen godkjent pris ennå.
alter table public.wishlist_items
  alter column target_ore drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wishlist_items_status_check') then
    alter table public.wishlist_items
      add constraint wishlist_items_status_check
      check (status in ('PROPOSED', 'ACTIVE', 'PAID', 'DECLINED'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wishlist_items_created_by_check') then
    alter table public.wishlist_items
      add constraint wishlist_items_created_by_check
      check (created_by in ('PARENT', 'CHILD'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'wishlist_items_suggested_ore_check') then
    alter table public.wishlist_items
      add constraint wishlist_items_suggested_ore_check
      check (suggested_ore is null or suggested_ore >= 0);
  end if;

  -- Sparemål og utbetalte ønsker må ha en pris.
  if not exists (select 1 from pg_constraint where conname = 'wishlist_items_priced_check') then
    alter table public.wishlist_items
      add constraint wishlist_items_priced_check
      check (status not in ('ACTIVE', 'PAID') or target_ore is not null);
  end if;
end
$$;

create index if not exists idx_wishlist_items_family_status
  on public.wishlist_items(family_id, status);

-- Godkjenner et ønske og betaler det ut hvis barnet har nok "Til gode".
--
-- "Til gode" er i hele appen summen av barnets APPROVED-krav, så ønsket
-- betales ved å gjøre krav om til PAID - eldste først, akkurat som en vanlig
-- utbetaling. Går ikke beløpet opp, deles det siste kravet: delen som brukes
-- blir PAID, resten blir et nytt APPROVED-krav. Da stemmer Til gode, Utbetalt
-- og Tjent totalt overalt uten at noen av stedene som regner dem må endres.
--
-- Alt skjer i én transaksjon med radlås, så to samtidige godkjenninger kan
-- ikke betale ut det samme ønsket eller de samme kravene to ganger.
create or replace function public.approve_wish(
  p_wish_id uuid,
  p_family_id uuid,
  p_target_ore integer,
  p_user_id uuid
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.wishlist_items%rowtype;
  c record;
  v_balance bigint;
  v_remaining integer;
  v_payment_id uuid;
begin
  if p_target_ore is null or p_target_ore <= 0 then
    raise exception 'INVALID_PRICE';
  end if;

  select * into w
  from public.wishlist_items
  where id = p_wish_id and family_id = p_family_id
  for update;

  if not found then
    raise exception 'WISH_NOT_FOUND';
  end if;
  if not w.active or w.status not in ('PROPOSED', 'ACTIVE') then
    raise exception 'WISH_ALREADY_HANDLED';
  end if;

  select coalesce(sum(amount_ore), 0) into v_balance
  from public.claims
  where child_id = w.child_id and family_id = p_family_id and status = 'APPROVED';

  if v_balance < p_target_ore then
    update public.wishlist_items
    set status = 'ACTIVE', target_ore = p_target_ore
    where id = w.id;
    return 'SAVING';
  end if;

  insert into public.payments (family_id, child_id, method, amount_ore, note, created_by)
  values (p_family_id, w.child_id, 'WISH', p_target_ore, w.title, p_user_id)
  returning id into v_payment_id;

  v_remaining := p_target_ore;
  for c in
    select *
    from public.claims
    where child_id = w.child_id and family_id = p_family_id and status = 'APPROVED'
    order by created_at, id
    for update
  loop
    exit when v_remaining <= 0;

    if c.amount_ore <= v_remaining then
      update public.claims set status = 'PAID', paid_at = now() where id = c.id;
      v_remaining := v_remaining - c.amount_ore;
    else
      insert into public.claims (family_id, child_id, task_id, amount_ore, status, created_at, decided_at, decided_by)
      values (c.family_id, c.child_id, c.task_id, c.amount_ore - v_remaining, 'APPROVED', c.created_at, c.decided_at, c.decided_by);
      update public.claims set amount_ore = v_remaining, status = 'PAID', paid_at = now() where id = c.id;
      v_remaining := 0;
    end if;

    insert into public.payment_claims (payment_id, claim_id) values (v_payment_id, c.id);
  end loop;

  -- Saldoen endret seg mellom summering og låsing: rull tilbake alt.
  if v_remaining > 0 then
    raise exception 'BALANCE_CHANGED';
  end if;

  update public.wishlist_items
  set status = 'PAID', target_ore = p_target_ore, paid_at = now(), payment_id = v_payment_id
  where id = w.id;

  return 'PAID';
end;
$$;

-- Kalles kun fra serveren med service role, aldri direkte fra nettleseren.
revoke all on function public.approve_wish(uuid, uuid, integer, uuid) from public;
revoke all on function public.approve_wish(uuid, uuid, integer, uuid) from anon, authenticated;
grant execute on function public.approve_wish(uuid, uuid, integer, uuid) to service_role;
