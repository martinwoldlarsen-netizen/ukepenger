-- Bonus når barnet når en milepæl (10, 50, 100 oppgaver). Foreldrene velger
-- beløpene på forhånd; tomt = av. Barnet ser bonusen på merket før det når den.
alter table public.families
  add column if not exists milestone_bonus_ore jsonb not null default '{}'::jsonb;

-- Husker hvilke bonuser som er gitt, så samme milepæl aldri betales to ganger
-- (f.eks. hvis et krav angres og godkjennes på nytt).
create table if not exists public.milestone_bonuses (
  child_id uuid not null references public.children(id) on delete cascade,
  milestone integer not null,
  claim_id uuid references public.claims(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (child_id, milestone)
);
alter table public.milestone_bonuses enable row level security;
revoke all on public.milestone_bonuses from anon, authenticated;

create or replace function public.claims_milestone_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
  where child_id = new.child_id and task_id is not null and status in ('APPROVED', 'PAID');

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
$$;

drop trigger if exists claims_milestone_bonus on public.claims;
create trigger claims_milestone_bonus
  after insert or update of status on public.claims
  for each row execute function public.claims_milestone_bonus();
