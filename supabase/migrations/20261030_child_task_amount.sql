-- Egen lønn per barn for en oppgave. Tom = oppgavens vanlige pris (tasks.amount_ore).
-- Brukes av barnesiden (prisen barnet ser) og når kravet lagres.
alter table public.child_task_settings
  add column if not exists amount_ore integer check (amount_ore is null or (amount_ore >= 0 and amount_ore <= 1000000));
