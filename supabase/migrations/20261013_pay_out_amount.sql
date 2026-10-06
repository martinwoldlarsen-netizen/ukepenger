-- Utbetal et fritt beløp fra barnets pott («til gode»), f.eks. 34,50 kr for et
-- Lego-sett. Kravene brukes eldste først; et krav som bare delvis brukes, deles
-- i en betalt del og en rest som blir stående som «til gode».
--
-- Resten lagres uten task_id (med notat «🪙 Rest av …»), så oppgaven ikke telles
-- dobbelt for trofeer og merker. approve_wish bruker samme hjelpefunksjon.

create or replace function public._pay_from_balance(
  p_family_id uuid, p_child_id uuid, p_amount_ore integer, p_method text, p_note text, p_user_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  c record;
  v_balance bigint;
  v_remaining integer := p_amount_ore;
  v_payment_id uuid;
  v_title text;
begin
  if p_amount_ore is null or p_amount_ore <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select coalesce(sum(amount_ore), 0) into v_balance
  from claims where child_id = p_child_id and family_id = p_family_id and status = 'APPROVED';
  if v_balance < p_amount_ore then
    raise exception 'NOT_ENOUGH';
  end if;

  insert into payments (family_id, child_id, method, amount_ore, note, created_by)
  values (p_family_id, p_child_id, p_method, p_amount_ore, nullif(trim(p_note), ''), p_user_id)
  returning id into v_payment_id;

  for c in
    select cl.*, t.title as task_title
    from claims cl left join tasks t on t.id = cl.task_id
    where cl.child_id = p_child_id and cl.family_id = p_family_id and cl.status = 'APPROVED'
    order by cl.created_at, cl.id
    for update of cl
  loop
    exit when v_remaining <= 0;
    if c.amount_ore <= v_remaining then
      update claims set status = 'PAID', paid_at = now() where id = c.id;
      v_remaining := v_remaining - c.amount_ore;
    else
      v_title := case when c.task_id is null then c.note else '🪙 Rest av ' || coalesce(c.task_title, 'oppgave') end;
      insert into claims (family_id, child_id, task_id, amount_ore, status, note, created_at, decided_at, decided_by, savings_applied)
      values (c.family_id, c.child_id, null, c.amount_ore - v_remaining, 'APPROVED', v_title, c.created_at, c.decided_at, c.decided_by, true);
      update claims set amount_ore = v_remaining, status = 'PAID', paid_at = now() where id = c.id;
      v_remaining := 0;
    end if;
    insert into payment_claims (payment_id, claim_id) values (v_payment_id, c.id);
  end loop;

  if v_remaining > 0 then
    raise exception 'BALANCE_CHANGED';
  end if;
  return v_payment_id;
end;
$fn$;
revoke all on function public._pay_from_balance(uuid, uuid, integer, text, text, uuid) from public, anon, authenticated;

-- Kalles av innlogget forelder (sjekker at barnet tilhører familien).
create or replace function public.pay_out_amount(p_child_id uuid, p_amount_ore integer, p_method text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_family uuid;
begin
  if p_method not in ('CASH', 'VIPPS', 'BANK', 'OTHER') then
    raise exception 'INVALID_METHOD';
  end if;
  select c.family_id into v_family
  from children c join profiles p on p.family_id = c.family_id
  where c.id = p_child_id and p.user_id = auth.uid();
  if v_family is null then
    raise exception 'NOT_ALLOWED';
  end if;
  return _pay_from_balance(v_family, p_child_id, p_amount_ore, p_method, left(p_note, 120), auth.uid());
end;
$fn$;
revoke all on function public.pay_out_amount(uuid, integer, text, text) from public, anon;
grant execute on function public.pay_out_amount(uuid, integer, text, text) to authenticated;

-- Ønskebutikken bruker samme logikk (og får dermed riktig trofé-telling).
create or replace function public.approve_wish(p_wish_id uuid, p_family_id uuid, p_target_ore integer, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  w public.wishlist_items%rowtype;
  v_balance bigint;
  v_payment_id uuid;
begin
  if p_target_ore is null or p_target_ore <= 0 then
    raise exception 'INVALID_PRICE';
  end if;

  select * into w from public.wishlist_items where id = p_wish_id and family_id = p_family_id for update;
  if not found then
    raise exception 'WISH_NOT_FOUND';
  end if;
  if not w.active or w.status not in ('PROPOSED', 'ACTIVE') then
    raise exception 'WISH_ALREADY_HANDLED';
  end if;

  select coalesce(sum(amount_ore), 0) into v_balance
  from public.claims where child_id = w.child_id and family_id = p_family_id and status = 'APPROVED';
  if v_balance < p_target_ore then
    update public.wishlist_items set status = 'ACTIVE', target_ore = p_target_ore where id = w.id;
    return 'SAVING';
  end if;

  v_payment_id := _pay_from_balance(p_family_id, w.child_id, p_target_ore, 'WISH', w.title, p_user_id);

  update public.wishlist_items
  set status = 'PAID', target_ore = p_target_ore, paid_at = now(), payment_id = v_payment_id
  where id = w.id;
  return 'PAID';
end;
$fn$;
