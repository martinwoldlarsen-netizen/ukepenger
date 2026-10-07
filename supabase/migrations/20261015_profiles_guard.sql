-- Sikkerhet: en innlogget bruker skal ikke kunne flytte profilen sin inn i en
-- annen familie eller gi seg selv en annen rolle direkte fra klienten.
-- Lovlige veier:
--   * ny familie: profilen får family_id til en helt ny familie uten medlemmer
--     (laget de siste 10 minuttene) – det er det onboarding gjør.
--   * invitasjon: går via server-API med service role, som ikke stoppes her.

create or replace function public._family_is_fresh_and_empty(p_family_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from families f
    where f.id = p_family_id
      and f.created_at > now() - interval '10 minutes'
  )
  and not exists (
    select 1 from profiles p
    where p.family_id = p_family_id and p.user_id <> p_user_id
  );
$$;

revoke all on function public._family_is_fresh_and_empty(uuid, uuid) from public, anon;

create or replace function public.profiles_guard()
returns trigger
language plpgsql
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
         or not public._family_is_fresh_and_empty(new.family_id, new.user_id) then
        raise exception 'Ikke lov å bytte familie selv';
      end if;
    end if;
    return new;
  end if;

  -- INSERT
  if new.role is distinct from 'ADMIN' then
    raise exception 'Ugyldig rolle';
  end if;
  if new.family_id is not null
     and not public._family_is_fresh_and_empty(new.family_id, new.user_id) then
    raise exception 'Ikke lov å bli med i en familie uten invitasjon';
  end if;
  return new;
end;
$$;

-- Guard-triggeren kjører som den innloggede, så den trenger å kunne kalle
-- hjelpefunksjonen (som ser alle profiler via security definer).
grant execute on function public._family_is_fresh_and_empty(uuid, uuid) to authenticated;

create or replace trigger profiles_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_guard();
