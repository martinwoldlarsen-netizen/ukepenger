-- Sparing i hele kroner: delen som spares rundes til nærmeste hele krone, så
-- barnet får hele kroner til gode (25 kr med 10 % = 3 kr spart, 22 kr til gode).
-- Ørebeløp gikk ikke å betale ut kontant. Gjelder nye godkjenninger; krav som
-- allerede er godkjent, endres ikke. Samme regel finnes i lib/money.ts (savedPartOre).
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

  -- Nærmeste hele krone (halv krone rundes opp), aldri mer enn hele beløpet.
  v_save := least(round(new.amount_ore * v_percent / 100.0 / 100.0)::integer * 100, new.amount_ore);
  if v_save <= 0 then
    return new;
  end if;

  new.amount_ore := new.amount_ore - v_save;
  new.saved_ore := new.saved_ore + v_save;
  return new;
end;
$$;
revoke all on function public.apply_claim_savings() from public, anon, authenticated;
