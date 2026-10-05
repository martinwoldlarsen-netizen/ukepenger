-- Trofeer: nivåer per oppgave + totalmilepæler. Trofeene regnes ut fra
-- kravene (kan aldri mistes). Penger gis automatisk når et krav godkjennes og
-- treffer et nivå, én gang per barn og trofé. Ingen etterbetaling: nivåer som
-- allerede er passert når trofeer slås på, gir ikke penger.

-- Innstillinger per familie:
-- { enabled, level_ore, big_ore, totals: {"10": øre, ...}, task_off: [task_id], names: {task_id: navn} }
alter table public.families
  add column if not exists trophy_settings jsonb not null default '{}'::jsonb;

create table if not exists public.trophy_awards (
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('task', 'total')),
  ref text not null,          -- task_id for 'task', 'all' for 'total'
  level integer not null,     -- nivå (task) eller antall oppgaver (total)
  amount_ore integer not null default 0,
  claim_id uuid references public.claims(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (child_id, kind, ref, level)
);
create index if not exists trophy_awards_claim_id_idx on public.trophy_awards (claim_id);
alter table public.trophy_awards enable row level security;
revoke all on public.trophy_awards from anon, authenticated;

-- Nivågrenser (antall ganger). Samme liste finnes i lib/trophies.ts.
create or replace function public.trophy_level_for(p_count integer)
returns integer language sql immutable as $$
  select array_position(array[5,10,20,35,50,75,100,150,200,250,300,400,500,750,1000], p_count)
$$;

-- Flytt eksisterende milepælsbonus inn i trofé-innstillingene.
update public.families
set trophy_settings = jsonb_build_object('enabled', true, 'level_ore', 500, 'big_ore', 5000, 'totals', milestone_bonus_ore)
where milestone_bonus_ore <> '{}'::jsonb and trophy_settings = '{}'::jsonb;
insert into public.trophy_awards (child_id, kind, ref, level, claim_id, created_at)
select child_id, 'total', 'all', milestone, claim_id, created_at from public.milestone_bonuses
on conflict do nothing;

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

  -- 1) Nivå på denne oppgaven
  if not coalesce(s -> 'task_off' ? new.task_id::text, false) then
    select count(*) into v_task_rank from claims
    where child_id = new.child_id and task_id = new.task_id and status in ('APPROVED', 'PAID')
      and (coalesce(decided_at, created_at), id) <= (v_key, new.id);
    v_level := trophy_level_for(v_task_rank);
    if v_level is not null then
      v_amount := case when v_level % 5 = 0 then coalesce((s ->> 'big_ore')::integer, 0) else coalesce((s ->> 'level_ore')::integer, 0) end;
      v_amount := least(greatest(v_amount, 0), 100000);
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
  v_amount := least(greatest(coalesce((s -> 'totals' ->> v_total_rank::text)::integer, 0), 0), 100000);
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

-- Erstatter den gamle milepælstriggeren (funksjonen gjøres tom, så den aldri
-- kan betale dobbelt selv om triggeren skulle ligge igjen).
create or replace function public.claims_milestone_bonus()
returns trigger language plpgsql as $fn$ begin return null; end; $fn$;
drop trigger if exists claims_milestone_bonus on public.claims;
drop trigger if exists claims_trophies on public.claims;
create trigger claims_trophies
  after insert or update of status on public.claims
  for each row execute function public.claims_trophies();
