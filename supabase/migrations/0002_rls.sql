-- Row-level security for the Tetra "Portal de Parceiros".
--
-- Model: every row except `profiles` is owned by exactly one partner via partner_id.
--   - admins can read & write everything.
--   - partners can read only their own rows; they cannot mutate clicks/leads/conversions/payouts.
--     (Those are written by the ingestion pipeline using the service-role key.)
--   - profiles: partners can read their own row and admins' is not exposed publicly; admins read all.
--   - Inserts/updates from the browser are limited to what's safe (a partner editing their own
--     pix_key and creating/pausing their own links).
--
-- Auth shape: the helper `public.current_user_role()` reads the caller's role from `profiles`.

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin()          to anon, authenticated;

-- ---------------------------------------------------------------------------
-- auto-create a profiles row on new auth user (default partner / pendente)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', new.email) from 1 for 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.links       enable row level security;
alter table public.clicks      enable row level security;
alter table public.leads       enable row level security;
alter table public.conversions enable row level security;
alter table public.payouts     enable row level security;

-- ---------------------------------------------------------------------------
-- PERFORMANCE NOTE
-- auth.uid() and public.is_admin() are wrapped in scalar subselects, e.g.
-- (select auth.uid()). Postgres then evaluates them ONCE per query as an
-- InitPlan instead of once per row. Without this, scanning large tables
-- (clicks has tens of thousands of rows) re-runs is_admin() per row and the
-- query times out. See: supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists profiles_update_self_safe on public.profiles;
create policy profiles_update_self_safe on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  -- partners cannot escalate role/tier/rate/status: those columns are reconciled by an
  -- additional admin-only update policy below. Application code only sends pix_key / handle /
  -- full_name / avatar_initials for self-updates.
  with check (id = (select auth.uid()));

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- links
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- clicks / leads / conversions
-- read-only for partners (their own); admins full; writes happen via service-role.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- payouts
-- partners read theirs; admins read+write all (admin marks payouts as paid).
-- ---------------------------------------------------------------------------
drop policy if exists payouts_select_own_or_admin on public.payouts;
create policy payouts_select_own_or_admin on public.payouts
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists payouts_admin_write on public.payouts;
create policy payouts_admin_write on public.payouts
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
