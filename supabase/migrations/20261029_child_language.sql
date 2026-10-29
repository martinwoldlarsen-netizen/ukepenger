-- Språk på barnesiden, valgt per barn av forelderen: norsk, engelsk eller ukrainsk.
alter table public.children
  add column if not exists language text not null default 'nb' check (language in ('nb', 'en', 'uk'));
