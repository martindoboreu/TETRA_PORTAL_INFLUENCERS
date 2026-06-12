-- 0004_perf.sql — Performance fix for RLS.
--
-- Problem: policies called auth.uid() / public.is_admin() directly, which made
-- Postgres re-evaluate them ONCE PER ROW. On large tables (clicks ~26k rows)
-- the admin aggregate queries took ~4s each and timed out (error 57014),
-- crashing the admin pages.
--
-- Fix: wrap those calls in scalar subselects -> evaluated once per query.
-- This file is idempotent; run it once in the Supabase SQL editor.
-- (0002_rls.sql and 0003_views.sql were also updated for fresh installs.)

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists profiles_update_self_safe on public.profiles;
create policy profiles_update_self_safe on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- links ----------------------------------------------------------------------
drop policy if exists links_select_own_or_admin on public.links;
create policy links_select_own_or_admin on public.links
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists links_insert_own on public.links;
create policy links_insert_own on public.links
  for insert to authenticated
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists links_update_own on public.links;
create policy links_update_own on public.links
  for update to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists links_delete_own on public.links;
create policy links_delete_own on public.links
  for delete to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

-- clicks / leads / conversions ----------------------------------------------
drop policy if exists clicks_select_own_or_admin on public.clicks;
create policy clicks_select_own_or_admin on public.clicks
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists clicks_admin_write on public.clicks;
create policy clicks_admin_write on public.clicks
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists leads_select_own_or_admin on public.leads;
create policy leads_select_own_or_admin on public.leads
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists leads_admin_write on public.leads;
create policy leads_admin_write on public.leads
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists conversions_select_own_or_admin on public.conversions;
create policy conversions_select_own_or_admin on public.conversions
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists conversions_admin_write on public.conversions;
create policy conversions_admin_write on public.conversions
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- payouts --------------------------------------------------------------------
drop policy if exists payouts_select_own_or_admin on public.payouts;
create policy payouts_select_own_or_admin on public.payouts
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists payouts_admin_write on public.payouts;
create policy payouts_admin_write on public.payouts
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- program_settings -----------------------------------------------------------
drop policy if exists program_settings_admin_write on public.program_settings;
create policy program_settings_admin_write on public.program_settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Helpful composite indexes for the aggregate scans (no-op if already present).
create index if not exists clicks_created_at_idx       on public.clicks(created_at);
create index if not exists leads_created_at_idx         on public.leads(created_at);
create index if not exists conversions_created_at_idx   on public.conversions(created_at);
create index if not exists conversions_partner_status_idx on public.conversions(partner_id, status);
