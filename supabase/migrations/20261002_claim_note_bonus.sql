-- Bonus: en voksen kan gi et barn et beløp med en kort tekst ("Bonus: hjalp
-- til ekstra"). Lagres som et vanlig godkjent krav uten oppgave, med teksten
-- her. Butikksalg har fortsatt ingen tekst. Kun et tillegg, ingenting endres.

alter table public.claims add column if not exists note text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'claims_note_length_check') then
    alter table public.claims add constraint claims_note_length_check check (note is null or char_length(note) <= 120);
  end if;
end
$$;
