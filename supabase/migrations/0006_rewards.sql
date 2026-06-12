-- 0006_rewards.sql — Rewards / gamification.
-- Partners progress toward prizes based on NUMBER OF CONVERSIONS in the current cycle.

-- ---------------------------------------------------------------------------
-- reward cycle config (lives on the single-row program_settings)
-- ---------------------------------------------------------------------------
alter table public.program_settings add column if not exists reward_cycle_start date not null default date_trunc('year', now())::date;
alter table public.program_settings add column if not exists reward_cycle_label text not null default ('Temporada ' || extract(year from now())::text);

-- ---------------------------------------------------------------------------
-- reward_tiers — admin-configurable prize ladder, keyed by conversion count
-- ---------------------------------------------------------------------------
create table if not exists public.reward_tiers (
  id                    smallint primary key,
  label                 text not null,
  prize                 text not null,
  threshold_conversions int  not null check (threshold_conversions > 0),
  icon                  text,           -- optional lucide icon name
  sort_order            smallint not null default 0
);

insert into public.reward_tiers (id, label, prize, threshold_conversions, icon, sort_order) values
  (1, 'Bronze',    'Kit de boas-vindas Tetra',                10,  'gift',     1),
  (2, 'Prata',     'Fone de ouvido premium',                  25,  'headphones', 2),
  (3, 'Ouro',      'Viagem nacional (fim de semana)',         50,  'plane',    3),
  (4, 'Platina',   'Viagem internacional',                    100, 'palmtree', 4),
  (5, 'Lendário',  'Experiência VIP + bônus em dinheiro',     200, 'crown',    5)
on conflict (id) do update set
  label = excluded.label,
  prize = excluded.prize,
  threshold_conversions = excluded.threshold_conversions,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

alter table public.reward_tiers enable row level security;

drop policy if exists reward_tiers_select_all on public.reward_tiers;
create policy reward_tiers_select_all on public.reward_tiers
  for select to authenticated using (true);

drop policy if exists reward_tiers_admin_write on public.reward_tiers;
create policy reward_tiers_admin_write on public.reward_tiers
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- progress: conversions in the current cycle for a partner (RLS scopes rows)
-- ---------------------------------------------------------------------------
create or replace function public.partner_reward_progress(p_partner uuid)
returns table (
  conversoes_ciclo bigint,
  cycle_start      date,
  cycle_label      text
)
language sql
stable
as $$
  select
    (select count(*) from public.conversions c
       where c.partner_id = p_partner
         and c.status <> 'reembolsado'
         and c.created_at >= (select reward_cycle_start from public.program_settings where id = 1))::bigint,
    (select reward_cycle_start from public.program_settings where id = 1),
    (select reward_cycle_label from public.program_settings where id = 1);
$$;

grant execute on function public.partner_reward_progress(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin: reward standings across all partners (top performers in the cycle)
-- ---------------------------------------------------------------------------
create or replace function public.admin_reward_standings()
returns table (
  partner_id       uuid,
  full_name        text,
  handle           text,
  avatar_initials  text,
  conversoes_ciclo bigint
)
language sql
stable
as $$
  select
    p.id, p.full_name, p.handle, p.avatar_initials,
    coalesce(count(c.id) filter (where c.status <> 'reembolsado'
      and c.created_at >= (select reward_cycle_start from public.program_settings where id = 1)), 0)::bigint
  from public.profiles p
  left join public.conversions c on c.partner_id = p.id
  where p.role = 'partner'
  group by p.id, p.full_name, p.handle, p.avatar_initials
  order by 5 desc;
$$;

grant execute on function public.admin_reward_standings() to authenticated;
