create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  title text not null,
  target_ore integer not null check (target_ore >= 0),
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_wishlist_items_family_child
  on public.wishlist_items(family_id, child_id);

alter table public.wishlist_items enable row level security;

drop policy if exists wishlist_items_all_family on public.wishlist_items;
create policy wishlist_items_all_family on public.wishlist_items
for all
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.family_id = public.wishlist_items.family_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.family_id = public.wishlist_items.family_id
  )
);
