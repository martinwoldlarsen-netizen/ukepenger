-- Trofeer kan tilpasses per familie. Nye, valgfrie felt i families.trophy_settings
-- (mangler de, gjelder standarden som før):
--   hidden    true = trofeer per oppgave er slått av (vises ikke, gir ikke penger)
--   levels    [5, 10, 20, …] antall ganger for hvert nivå (stigende)
--   pay_from  første nivå som gir penger (standard 1)
--   big_every stor premie hvert N. nivå (standard 5, 0 = aldri)
-- Ugyldige verdier ignoreres, så et godkjent krav aldri feiler på grunn av
-- innstillingene. Allerede utbetalte nivåer betales aldri på nytt (trophy_awards).

create or replace function public.trophy_int(p jsonb, p_default integer, p_min integer, p_max integer)
returns integer language sql immutable as $$
  select case
    when jsonb_typeof(p) = 'number' and (p #>> '{}') ~ '^[0-9]{1,6}$'
      then least(greatest((p #>> '{}')::integer, p_min), p_max)
    else p_default
  end
$$;
revoke execute on function public.trophy_int(jsonb, integer, integer, integer) from public, anon, authenticated;

create or replace function public.claims_trophies()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  s jsonb;
  v_key timestamptz;
  v_task_rank integer;
  v_total_rank integer;
  v_level integer;
  v_amount integer;
  v_name text;
  v_claim uuid;
  v_levels integer[];
  v_big integer;
  v_from integer;
begin
  if new.task_id is null or new.status <> 'APPROVED' then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.status in ('APPROVED', 'PAID') then
    return null;
  end if;
  select trophy_settings into s from families where id = new.family_id;
  if not coalesce((s ->> 'enabled')::boolean, false) then
    return null;
  end if;

  -- Plassen i rekkefølgen (ikke totalen), så «Godkjenn alle» treffer nivåene.
  v_key := coalesce(new.decided_at, new.created_at);

  -- 1) Nivå på denne oppgaven (ikke når trofeer er slått av)
  if not coalesce((s ->> 'hidden')::boolean, false) and not coalesce(s -> 'task_off' ? new.task_id::text, false) then
    select coalesce(array_agg(x::integer order by ord), '{}') into v_levels
    from jsonb_array_elements_text(case when jsonb_typeof(s -> 'levels') = 'array' then s -> 'levels' else '[]'::jsonb end) with ordinality as e(x, ord)
    where x ~ '^[0-9]{1,5}$';
    if cardinality(v_levels) = 0 then
      v_levels := array[5,10,20,35,50,75,100,150,200,250,300,400,500,750,1000];
    end if;
    v_big := trophy_int(s -> 'big_every', 5, 0, 50);
    v_from := trophy_int(s -> 'pay_from', 1, 1, 50);

    select count(*) into v_task_rank from claims
    where child_id = new.child_id and task_id = new.task_id and status in ('APPROVED', 'PAID')
      and (coalesce(decided_at, created_at), id) <= (v_key, new.id);
    v_level := array_position(v_levels, v_task_rank);
    if v_level is not null and v_level >= v_from then
      v_amount := case when v_big > 0 and v_level % v_big = 0
        then trophy_int(s -> 'big_ore', 0, 0, 100000)
        else trophy_int(s -> 'level_ore', 0, 0, 100000) end;
      if v_amount > 0 then
        insert into trophy_awards (child_id, kind, ref, level, amount_ore)
        values (new.child_id, 'task', new.task_id::text, v_level, v_amount)
        on conflict do nothing;
        if found then
          select coalesce(nullif(s -> 'names' ->> new.task_id::text, ''), title) into v_name from tasks where id = new.task_id;
          insert into claims (family_id, child_id, task_id, amount_ore, status, note, decided_at)
          values (new.family_id, new.child_id, null, v_amount, 'APPROVED', '🏆 ' || v_name || ' nivå ' || v_level, now())
          returning id into v_claim;
          update trophy_awards set claim_id = v_claim
          where child_id = new.child_id and kind = 'task' and ref = new.task_id::text and level = v_level;
        end if;
      end if;
    end if;
  end if;

  -- 2) Totalmilepæl
  select count(*) into v_total_rank from claims
  where child_id = new.child_id and task_id is not null and status in ('APPROVED', 'PAID')
    and (coalesce(decided_at, created_at), id) <= (v_key, new.id);
  v_amount := trophy_int(s -> 'totals' -> v_total_rank::text, 0, 0, 100000);
  if v_amount > 0 then
    insert into trophy_awards (child_id, kind, ref, level, amount_ore)
    values (new.child_id, 'total', 'all', v_total_rank, v_amount)
    on conflict do nothing;
    if found then
      insert into claims (family_id, child_id, task_id, amount_ore, status, note, decided_at)
      values (new.family_id, new.child_id, null, v_amount, 'APPROVED', '🏅 Bonus for ' || v_total_rank || ' oppgaver', now())
      returning id into v_claim;
      update trophy_awards set claim_id = v_claim
      where child_id = new.child_id and kind = 'total' and ref = 'all' and level = v_total_rank;
    end if;
  end if;
  return null;
end;
$fn$;
revoke execute on function public.claims_trophies() from public, anon, authenticated;
