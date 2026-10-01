-- Sparing: en fast prosent av alt barnet tjener settes av automatisk.
--
-- Når et krav blir godkjent (uansett vei: forelder godkjenner, auto-godkjenning,
-- butikksalg), trekkes sparedelen fra kravets beløp og legges i saved_ore.
-- "Til gode" er i hele appen summen av APPROVED-krav, så den blir automatisk
-- beløpet minus sparing - utbetalinger, ønsker og alle saldoer virker uendret.
-- Sparesaldo = sum(saved_ore) for godkjente og utbetalte krav.
--
-- Gjelder bare krav som godkjennes etter at sparing er slått på; allerede
-- godkjente krav røres ikke. Eksisterende familier starter på 0 % og slår det
-- på selv under Innstillinger.

alter table public.families
  add column if not exists savings_percent integer not null default 0,
  add column if not exists show_savings_to_kids boolean not null default true;

alter table public.claims
  add column if not exists saved_ore integer not null default 0,
  add column if not exists savings_applied boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'families_savings_percent_check') then
    alter table public.families
      add constraint families_savings_percent_check check (savings_percent between 0 and 50);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'claims_saved_ore_check') then
    alter table public.claims
      add constraint claims_saved_ore_check check (saved_ore >= 0);
  end if;
end
$$;

create or replace function public.apply_claim_savings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_percent integer;
  v_save integer;
begin
  -- Bare i overgangen til APPROVED, og bare én gang per krav.
  if new.status <> 'APPROVED' or new.savings_applied then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'APPROVED' then
    return new;
  end if;

  new.savings_applied := true;

  select savings_percent into v_percent from public.families where id = new.family_id;
  if coalesce(v_percent, 0) <= 0 then
    return new;
  end if;

  v_save := floor(new.amount_ore * v_percent / 100.0);
  if v_save <= 0 then
    return new;
  end if;

  new.amount_ore := new.amount_ore - v_save;
  new.saved_ore := new.saved_ore + v_save;
  return new;
end;
$$;

-- Opprettes bare hvis den mangler (ingen drop), så migrasjonen kan kjøres
-- på nytt uten destruktive setninger.
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'claims_apply_savings') then
    create trigger claims_apply_savings
      before insert or update of status on public.claims
      for each row execute function public.apply_claim_savings();
  end if;
end
$$;

-- approve_wish deler et krav når ønsket ikke går opp. Resten-kravet er
-- allerede ferdig spart fra, og skal ikke trekkes sparing én gang til.
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
      insert into public.claims (family_id, child_id, task_id, amount_ore, status, created_at, decided_at, decided_by, savings_applied)
      values (c.family_id, c.child_id, c.task_id, c.amount_ore - v_remaining, 'APPROVED', c.created_at, c.decided_at, c.decided_by, true);
      update public.claims set amount_ore = v_remaining, status = 'PAID', paid_at = now() where id = c.id;
      v_remaining := 0;
    end if;

    insert into public.payment_claims (payment_id, claim_id) values (v_payment_id, c.id);
  end loop;

  if v_remaining > 0 then
    raise exception 'BALANCE_CHANGED';
  end if;

  update public.wishlist_items
  set status = 'PAID', target_ore = p_target_ore, paid_at = now(), payment_id = v_payment_id
  where id = w.id;

  return 'PAID';
end;
$$;

revoke all on function public.approve_wish(uuid, uuid, integer, uuid) from public;
revoke all on function public.approve_wish(uuid, uuid, integer, uuid) from anon, authenticated;
grant execute on function public.approve_wish(uuid, uuid, integer, uuid) to service_role;
revoke all on function public.apply_claim_savings() from public, anon, authenticated;
