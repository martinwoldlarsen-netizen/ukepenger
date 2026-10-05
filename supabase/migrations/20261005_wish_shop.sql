-- Ønskebutikken: barnet velger ønsker fra kategorier (med emoji) og kan trykke
-- «Kjøp» når det har spart nok. Kjøpet er en beskjed til de voksne (de må jo
-- kjøpe tingen i virkeligheten); de betaler ut ønsket under Krav som før.
-- Kun tillegg, ingenting eksisterende endres.

alter table public.wishlist_items
  add column if not exists emoji text,
  add column if not exists purchase_requested_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wishlist_items_emoji_length_check') then
    alter table public.wishlist_items add constraint wishlist_items_emoji_length_check check (emoji is null or char_length(emoji) <= 16);
  end if;
end
$$;
