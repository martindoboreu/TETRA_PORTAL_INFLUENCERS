-- Resolve Supabase database linter warnings:
--   0011 function_search_path_mutable
--   0028 anon_security_definer_function_executable
--   0029 authenticated_security_definer_function_executable (admin-only RPCs)
--
-- Auth dashboard setting "leaked password protection" is not SQL — enable it in
-- Supabase Dashboard → Authentication → Providers → Email.

-- ---------------------------------------------------------------------------
-- 1) Pin search_path on every flagged function
-- ---------------------------------------------------------------------------
alter function public.partner_kpis_in_range(uuid, timestamptz, timestamptz)
  set search_path = public;
alter function public.partner_chart_in_range(uuid, timestamptz, timestamptz, text)
  set search_path = public;
alter function public.partner_funnel_in_range(uuid, timestamptz, timestamptz)
  set search_path = public;
alter function public.partner_link_performance_in_range(uuid, timestamptz, timestamptz)
  set search_path = public;
alter function public.admin_program_kpis_in_range(timestamptz, timestamptz)
  set search_path = public;
alter function public.admin_chart_in_range(timestamptz, timestamptz, text)
  set search_path = public;
alter function public.admin_partner_rollup_in_range(timestamptz, timestamptz)
  set search_path = public;
alter function public.influence_level_for(int)
  set search_path = public;
alter function public.partner_reward_progress(uuid)
  set search_path = public;
alter function public.admin_reward_standings()
  set search_path = public;
alter function public.touch_updated_at()
  set search_path = public;

-- ---------------------------------------------------------------------------
-- 2) RPC helpers — authenticated only (revoke default PUBLIC + anon grants)
-- ---------------------------------------------------------------------------
revoke all on function public.partner_kpis_in_range(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.partner_kpis_in_range(uuid, timestamptz, timestamptz) to authenticated;

revoke all on function public.partner_chart_in_range(uuid, timestamptz, timestamptz, text) from public, anon;
grant execute on function public.partner_chart_in_range(uuid, timestamptz, timestamptz, text) to authenticated;

revoke all on function public.partner_funnel_in_range(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.partner_funnel_in_range(uuid, timestamptz, timestamptz) to authenticated;

revoke all on function public.partner_link_performance_in_range(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.partner_link_performance_in_range(uuid, timestamptz, timestamptz) to authenticated;

revoke all on function public.admin_program_kpis_in_range(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_program_kpis_in_range(timestamptz, timestamptz) to authenticated;

revoke all on function public.admin_chart_in_range(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.admin_chart_in_range(timestamptz, timestamptz, text) to authenticated;

revoke all on function public.admin_partner_rollup_in_range(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_partner_rollup_in_range(timestamptz, timestamptz) to authenticated;

revoke all on function public.influence_level_for(int) from public, anon;
grant execute on function public.influence_level_for(int) to authenticated;

revoke all on function public.partner_reward_progress(uuid) from public, anon;
grant execute on function public.partner_reward_progress(uuid) to authenticated;

revoke all on function public.admin_reward_standings() from public, anon;
grant execute on function public.admin_reward_standings() to authenticated;

-- RLS helpers: partners/admins need these; anon does not.
revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Trigger-only functions — not callable via PostgREST /rpc
-- ---------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.apply_influence() from public, anon, authenticated;
revoke all on function public.apply_society_tier() from public, anon, authenticated;
revoke all on function public.ensure_admin_profile() from public, anon, authenticated;
revoke all on function public.mark_onboarding_complete() from public, anon, authenticated;
revoke all on function public.sync_profile_followers() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Admin-only SECURITY DEFINER RPCs — service_role only (server actions)
--    Drop the in-function is_admin() guard on admin_mark_partner_paid because
--    auth.uid() is null under the service-role key; the app asserts admin first.
-- ---------------------------------------------------------------------------
create or replace function public.admin_mark_partner_paid(
  p_partner          uuid,
  p_reference_period text default null
)
returns table (payout_id uuid, amount numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total      numeric;
  v_payout_id  uuid;
begin
  select coalesce(sum(commission), 0) into v_total
  from public.conversions
  where partner_id = p_partner and status = 'confirmado' and payout_id is null;

  if v_total = 0 then
    return;
  end if;

  insert into public.payouts (partner_id, amount, status, reference_period, paid_at)
  values (p_partner, v_total, 'pago',
          coalesce(p_reference_period, to_char(now() at time zone 'America/Sao_Paulo', 'TMMon YYYY')),
          now())
  returning id into v_payout_id;

  update public.conversions
     set status = 'pago', payout_id = v_payout_id
   where partner_id = p_partner and status = 'confirmado' and payout_id is null;

  return query select v_payout_id, v_total;
end;
$$;

revoke all on function public.admin_mark_partner_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_mark_partner_paid(uuid, text) to service_role;

revoke all on function public.reapply_influence_rates() from public, anon, authenticated;
grant execute on function public.reapply_influence_rates() to service_role;

revoke all on function public.reapply_society_rates() from public, anon, authenticated;
grant execute on function public.reapply_society_rates() to service_role;
