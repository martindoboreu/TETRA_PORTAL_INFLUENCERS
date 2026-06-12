-- One-off cleanup: remove keyboard-mash link labels from a live database.
-- Run in the Supabase SQL editor. Only deletes links with zero attribution
-- history (no clicks, leads or conversions), so nothing financial is touched.
--
-- The same patterns are now rejected at creation time
-- (app/dashboard/links/actions.ts), so new junk can't be created.

with junk as (
  select id, label
  from public.links l
  where
    -- short pattern repeated: asdasd, asdasdasd, abcabc...
    lower(regexp_replace(l.label, '\s', '', 'g')) ~ '^(.{1,4})\1+$'
    -- or 4+ repeats of a single character: aaaa, !!!!!
    or lower(l.label) ~ '(.)\1{3,}'
)
delete from public.links l
using junk j
where l.id = j.id
  and not exists (select 1 from public.clicks      c where c.link_id = l.id)
  and not exists (select 1 from public.leads       e where e.link_id = l.id)
  and not exists (select 1 from public.conversions v where v.link_id = l.id)
returning l.id, l.label;
