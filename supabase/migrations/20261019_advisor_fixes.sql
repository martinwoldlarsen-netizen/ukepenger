-- Rådene fra Supabase (database linter):
-- 1) Fast search_path på funksjoner, så de ikke kan lures av andre skjemaer.
alter function public.trophy_level_for(integer) set search_path = public;
alter function public.claims_milestone_bonus() set search_path = public;
alter function public.profiles_guard() set search_path = public;

-- 2) Hjelpefunksjonen for profiles_guard flyttes ut av det offentlige API-et
--    (skjemaet «private» eksponeres ikke via /rest/v1/rpc).
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.family_is_fresh_and_empty(p_family_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.families f
    where f.id = p_family_id
      and f.created_at > now() - interval '10 minutes'
  )
  and not exists (
    select 1 from public.profiles p
    where p.family_id = p_family_id and p.user_id <> p_user_id
  );
$$;

revoke all on function private.family_is_fresh_and_empty(uuid, uuid) from public, anon;
grant execute on function private.family_is_fresh_and_empty(uuid, uuid) to authenticated;

create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Bare forespørsler fra klienten (rollen «authenticated») sjekkes.
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id then
      raise exception 'Ikke lov å endre bruker på profilen';
    end if;
    if new.role is distinct from old.role then
      raise exception 'Ikke lov å endre rolle selv';
    end if;
    if new.family_id is distinct from old.family_id then
      if old.family_id is not null or new.family_id is null
         or not private.family_is_fresh_and_empty(new.family_id, new.user_id) then
        raise exception 'Ikke lov å bytte familie selv';
      end if;
    end if;
    return new;
  end if;

  if new.role is distinct from 'ADMIN' then
    raise exception 'Ugyldig rolle';
  end if;
  if new.family_id is not null
     and not private.family_is_fresh_and_empty(new.family_id, new.user_id) then
    raise exception 'Ikke lov å bli med i en familie uten invitasjon';
  end if;
  return new;
end;
$$;

-- Den gamle offentlige varianten brukes ikke lenger og stenges.
revoke execute on function public._family_is_fresh_and_empty(uuid, uuid) from authenticated, anon, public;
