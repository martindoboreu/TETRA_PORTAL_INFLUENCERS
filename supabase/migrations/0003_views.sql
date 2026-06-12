-- Query helpers (SQL functions) for partner KPIs and admin aggregates.
-- All functions are `stable` and read-only; they rely on RLS to scope rows for partners,
-- and admins call them through their own session so admin scope is automatic.

-- ---------------------------------------------------------------------------
-- program_settings (single-row config)
-- ---------------------------------------------------------------------------
create table if not exists public.program_settings (
  id                        smallint primary key default 1,
  default_commission_rate   numeric not null default 0.30 check (default_commission_rate between 0 and 1),
  next_payout_date          date,
  updated_at                timestamptz not null default now(),
  constraint program_settings_single_row check (id = 1)
);

insert into public.program_settings (id, default_commission_rate, next_payout_date)
  values (1, 0.30, (date_trunc('month', current_date) + interval '1 month + 4 days')::date)
  on conflict (id) do nothing;

alter table public.program_settings enable row level security;

drop policy if exists program_settings_select_all on public.program_settings;
create policy program_settings_select_all on public.program_settings
  for select to authenticated using (true);

drop policy if exists program_settings_admin_write on public.program_settings;
create policy program_settings_admin_write on public.program_settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- partner KPIs in range, with deltas vs prior period of same length
-- ---------------------------------------------------------------------------
create or replace function public.partner_kpis_in_range(
  p_partner uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
returns table (
  cliques              bigint,
  cliques_delta        numeric,
  leads                bigint,
  leads_delta          numeric,
  conversoes           bigint,
  conversoes_delta     numeric,
  taxa_conversao       numeric,
  taxa_conversao_delta numeric,
  comissao             numeric,
  comissao_delta       numeric,
  a_receber            numeric
)
language sql
stable
as $$
  with
  span as (select (p_to - p_from) as len),
  prev as (select p_from - (select len from span) as p_from, p_from as p_to),

  cur_clicks as (
    select count(*) c from public.clicks
    where partner_id = p_partner and created_at >= p_from and created_at < p_to
  ),
  prv_clicks as (
    select count(*) c from public.clicks
    where partner_id = p_partner
      and created_at >= (select p_from from prev)
      and created_at <  (select p_to   from prev)
  ),

  cur_leads as (
    select count(*) c from public.leads
    where partner_id = p_partner and created_at >= p_from and created_at < p_to
  ),
  prv_leads as (
    select count(*) c from public.leads
    where partner_id = p_partner
      and created_at >= (select p_from from prev)
      and created_at <  (select p_to   from prev)
  ),

  cur_conv as (
    select count(*) c, coalesce(sum(commission), 0) com from public.conversions
    where partner_id = p_partner and created_at >= p_from and created_at < p_to
      and status <> 'reembolsado'
  ),
  prv_conv as (
    select count(*) c, coalesce(sum(commission), 0) com from public.conversions
    where partner_id = p_partner
      and created_at >= (select p_from from prev)
      and created_at <  (select p_to   from prev)
      and status <> 'reembolsado'
  ),

  a_receber_cte as (
    select coalesce(sum(commission), 0) total from public.conversions
    where partner_id = p_partner
      and status = 'confirmado'
      and payout_id is null
  )

  select
    (select c   from cur_clicks)::bigint                                                   as cliques,
    case when (select c from prv_clicks) = 0 then 0
         else round(((select c from cur_clicks) - (select c from prv_clicks))::numeric
                    / (select c from prv_clicks) * 100, 1) end                              as cliques_delta,

    (select c   from cur_leads)::bigint                                                    as leads,
    case when (select c from prv_leads) = 0 then 0
         else round(((select c from cur_leads) - (select c from prv_leads))::numeric
                    / (select c from prv_leads) * 100, 1) end                               as leads_delta,

    (select c   from cur_conv)::bigint                                                     as conversoes,
    case when (select c from prv_conv) = 0 then 0
         else round(((select c from cur_conv) - (select c from prv_conv))::numeric
                    / (select c from prv_conv) * 100, 1) end                                as conversoes_delta,

    case when (select c from cur_clicks) = 0 then 0
         else round((select c from cur_conv)::numeric / (select c from cur_clicks) * 100, 1)
    end                                                                                    as taxa_conversao,
    case
      when (select c from prv_clicks) = 0 or (select c from cur_clicks) = 0 then 0
      else round(
        (select c from cur_conv)::numeric / (select c from cur_clicks) * 100
        - (select c from prv_conv)::numeric / (select c from prv_clicks) * 100,
      1) end                                                                                as taxa_conversao_delta,

    (select com from cur_conv)                                                              as comissao,
    case when (select com from prv_conv) = 0 then 0
         else round(((select com from cur_conv) - (select com from prv_conv))
                    / (select com from prv_conv) * 100, 1) end                              as comissao_delta,

    (select total from a_receber_cte)                                                       as a_receber;
$$;

grant execute on function public.partner_kpis_in_range(uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- partner time-series (cliques + conversoes) bucketed by day | week | month
-- ---------------------------------------------------------------------------
create or replace function public.partner_chart_in_range(
  p_partner uuid,
  p_from    timestamptz,
  p_to      timestamptz,
  p_bucket  text default 'day'
)
returns table (
  bucket      timestamptz,
  cliques     bigint,
  conversoes  bigint
)
language sql
stable
as $$
  with buckets as (
    select generate_series(
      date_trunc(p_bucket, p_from),
      date_trunc(p_bucket, p_to - interval '1 second'),
      ('1 ' || p_bucket)::interval
    ) as b
  ),
  c as (
    select date_trunc(p_bucket, created_at) as b, count(*) as n
    from public.clicks
    where partner_id = p_partner and created_at >= p_from and created_at < p_to
    group by 1
  ),
  v as (
    select date_trunc(p_bucket, created_at) as b, count(*) as n
    from public.conversions
    where partner_id = p_partner and created_at >= p_from and created_at < p_to
      and status <> 'reembolsado'
    group by 1
  )
  select b.b                          as bucket,
         coalesce(c.n, 0)::bigint     as cliques,
         coalesce(v.n, 0)::bigint     as conversoes
  from buckets b
  left join c on c.b = b.b
  left join v on v.b = b.b
  order by b.b;
$$;

grant execute on function public.partner_chart_in_range(uuid, timestamptz, timestamptz, text) to authenticated;

-- ---------------------------------------------------------------------------
-- partner funnel
-- ---------------------------------------------------------------------------
create or replace function public.partner_funnel_in_range(
  p_partner uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
returns table (
  cliques      bigint,
  leads        bigint,
  matriculas   bigint,
  pagos        bigint
)
language sql
stable
as $$
  select
    (select count(*) from public.clicks
       where partner_id = p_partner and created_at >= p_from and created_at < p_to)::bigint,
    (select count(*) from public.leads
       where partner_id = p_partner and created_at >= p_from and created_at < p_to)::bigint,
    (select count(*) from public.conversions
       where partner_id = p_partner and created_at >= p_from and created_at < p_to
         and status in ('confirmado', 'pago'))::bigint,
    (select count(*) from public.conversions
       where partner_id = p_partner and created_at >= p_from and created_at < p_to
         and status = 'pago')::bigint;
$$;

grant execute on function public.partner_funnel_in_range(uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- partner per-link rollup
-- ---------------------------------------------------------------------------
create or replace function public.partner_link_performance_in_range(
  p_partner uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
returns table (
  link_id         uuid,
  label           text,
  slug            text,
  cliques         bigint,
  leads           bigint,
  conversoes      bigint,
  taxa_conversao  numeric,
  comissao        numeric
)
language sql
stable
as $$
  select
    l.id, l.label, l.slug,
    coalesce(c.n, 0)::bigint as cliques,
    coalesce(ld.n, 0)::bigint as leads,
    coalesce(v.n, 0)::bigint as conversoes,
    case when coalesce(c.n, 0) = 0 then 0
         else round(coalesce(v.n, 0)::numeric / c.n * 100, 1) end as taxa_conversao,
    coalesce(v.com, 0) as comissao
  from public.links l
  left join lateral (
    select count(*) n from public.clicks
    where link_id = l.id and created_at >= p_from and created_at < p_to
  ) c on true
  left join lateral (
    select count(*) n from public.leads
    where link_id = l.id and created_at >= p_from and created_at < p_to
  ) ld on true
  left join lateral (
    select count(*) n, coalesce(sum(commission), 0) com from public.conversions
    where link_id = l.id and created_at >= p_from and created_at < p_to
      and status <> 'reembolsado'
  ) v on true
  where l.partner_id = p_partner
  order by cliques desc;
$$;

grant execute on function public.partner_link_performance_in_range(uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- admin: program-wide KPIs in range
-- ---------------------------------------------------------------------------
create or replace function public.admin_program_kpis_in_range(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  cliques            bigint,
  leads              bigint,
  conversoes         bigint,
  taxa_conversao     numeric,
  comissao_total     numeric,
  a_repassar         numeric,
  parceiros_ativos   bigint
)
language sql
stable
as $$
  with
  c  as (select count(*)::bigint n from public.clicks      where created_at >= p_from and created_at < p_to),
  ld as (select count(*)::bigint n from public.leads       where created_at >= p_from and created_at < p_to),
  v  as (select count(*)::bigint n, coalesce(sum(commission), 0) com from public.conversions
           where created_at >= p_from and created_at < p_to and status <> 'reembolsado'),
  ar as (select coalesce(sum(commission), 0) total from public.conversions
           where status = 'confirmado' and payout_id is null),
  pa as (select count(*)::bigint n from public.profiles where role = 'partner' and status = 'ativo')
  select
    (select n from c),
    (select n from ld),
    (select n from v),
    case when (select n from c) = 0 then 0
         else round((select n from v)::numeric / (select n from c) * 100, 1) end,
    (select com from v),
    (select total from ar),
    (select n from pa);
$$;

grant execute on function public.admin_program_kpis_in_range(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- admin: program-wide time-series (all partners) bucketed by day | week | month
-- ---------------------------------------------------------------------------
create or replace function public.admin_chart_in_range(
  p_from    timestamptz,
  p_to      timestamptz,
  p_bucket  text default 'day'
)
returns table (
  bucket      timestamptz,
  cliques     bigint,
  conversoes  bigint
)
language sql
stable
as $$
  with buckets as (
    select generate_series(
      date_trunc(p_bucket, p_from),
      date_trunc(p_bucket, p_to - interval '1 second'),
      ('1 ' || p_bucket)::interval
    ) as b
  ),
  c as (
    select date_trunc(p_bucket, created_at) as b, count(*) as n
    from public.clicks
    where created_at >= p_from and created_at < p_to
    group by 1
  ),
  v as (
    select date_trunc(p_bucket, created_at) as b, count(*) as n
    from public.conversions
    where created_at >= p_from and created_at < p_to
      and status <> 'reembolsado'
    group by 1
  )
  select b.b                          as bucket,
         coalesce(c.n, 0)::bigint     as cliques,
         coalesce(v.n, 0)::bigint     as conversoes
  from buckets b
  left join c on c.b = b.b
  left join v on v.b = b.b
  order by b.b;
$$;

grant execute on function public.admin_chart_in_range(timestamptz, timestamptz, text) to authenticated;

-- ---------------------------------------------------------------------------
-- admin: per-partner rollup (used by /admin/parceiros table and Top parceiros)
-- ---------------------------------------------------------------------------
create or replace function public.admin_partner_rollup_in_range(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  partner_id       uuid,
  full_name        text,
  handle           text,
  avatar_initials  text,
  tier             text,
  commission_rate  numeric,
  status           text,
  cliques          bigint,
  conversoes       bigint,
  comissao         numeric,
  a_receber        numeric
)
language sql
stable
as $$
  select
    p.id, p.full_name, p.handle, p.avatar_initials, p.tier, p.commission_rate, p.status,
    coalesce(c.n, 0)::bigint,
    coalesce(v.n, 0)::bigint,
    coalesce(v.com, 0),
    coalesce(ar.total, 0)
  from public.profiles p
  left join lateral (
    select count(*) n from public.clicks
    where partner_id = p.id and created_at >= p_from and created_at < p_to
  ) c on true
  left join lateral (
    select count(*) n, coalesce(sum(commission), 0) com from public.conversions
    where partner_id = p.id and created_at >= p_from and created_at < p_to
      and status <> 'reembolsado'
  ) v on true
  left join lateral (
    select coalesce(sum(commission), 0) total from public.conversions
    where partner_id = p.id and status = 'confirmado' and payout_id is null
  ) ar on true
  where p.role = 'partner'
  order by v.com desc nulls last, c.n desc nulls last;
$$;

grant execute on function public.admin_partner_rollup_in_range(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- admin: mark payout as paid — creates a payouts row covering all the partner's
-- currently confirmed-and-unpaid commissions, flips them to status='pago',
-- attaches payout_id. Returns the new payout row id + total amount.
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
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

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

grant execute on function public.admin_mark_partner_paid(uuid, text) to authenticated;
