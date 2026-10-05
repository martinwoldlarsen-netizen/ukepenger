alter table public.children
  add column if not exists weekly_allowance_ore integer not null default 0,
  add column if not exists allowance_weekday smallint not null default 6,
  add column if not exists allowance_paid_through date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'children_weekly_allowance_check') then
    alter table public.children add constraint children_weekly_allowance_check check (weekly_allowance_ore between 0 and 100000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'children_allowance_weekday_check') then
    alter table public.children add constraint children_allowance_weekday_check check (allowance_weekday between 1 and 7);
  end if;
end
$$;

create or replace function public.ensure_weekly_allowances(p_family_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_today date := (now() at time zone 'Europe/Oslo')::date;
  v_last date;
  v_next date;
  v_added integer := 0;
  v_rounds integer;
begin
  -- Innloggede må høre til familien; serveren (service role) har ingen auth.uid().
  if auth.uid() is not null and not exists (
    select 1 from profiles where user_id = auth.uid() and family_id = p_family_id
  ) then
    raise exception 'NOT_ALLOWED';
  end if;

  for c in
    select * from children
    where family_id = p_family_id and active and weekly_allowance_ore > 0
    for update
  loop
    -- Siste gang ukedagen inntraff (i dag teller med).
    v_last := v_today - ((extract(isodow from v_today)::int - c.allowance_weekday + 7) % 7);
    -- Nyslått på: start fra i dag (betal i dag hvis det er ukedagen), ikke bakover.
    if c.allowance_paid_through is null then
      c.allowance_paid_through := case when v_last = v_today then v_last - 7 else v_last end;
      update children set allowance_paid_through = c.allowance_paid_through where id = c.id;
    end if;

    v_next := c.allowance_paid_through + 7;
    v_rounds := 0;
    -- Maks 8 uker tilbake, så en lang pause ikke gir en stor overraskelse.
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
    update children set allowance_paid_through = v_next - 7 where id = c.id and v_next - 7 > coalesce(allowance_paid_through, '1970-01-01');
  end loop;

  return v_added;
end;
$$;

revoke all on function public.ensure_weekly_allowances(uuid) from public, anon;
grant execute on function public.ensure_weekly_allowances(uuid) to authenticated, service_role;
