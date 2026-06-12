-- 0005_influence.sql — Replace the manual Prata/Ouro/Diamante tier system with
-- a data-driven "influence level" derived from follower count.
--
-- Model (per product decision): commission rate is INVERSELY related to influence.
-- Smaller creators earn a higher % per conversion to incentivize them; mega
-- influencers earn a lower % per unit (they drive volume).
--
-- profiles.tier now holds the influence level label (computed, not manual).
-- profiles.commission_rate is computed from the matching level.
-- profiles.follower_count is the input (auto from integrations or manual admin).

-- ---------------------------------------------------------------------------
-- influence_levels — admin-configurable bands
-- ---------------------------------------------------------------------------
create table if not exists public.influence_levels (
  id               smallint primary key,
  label            text not null unique,
  min_followers    int  not null,
  max_followers    int,            -- null = unbounded (top band)
  commission_rate  numeric not null check (commission_rate >= 0 and commission_rate <= 1),
  sort_order       smallint not null default 0
);

insert into public.influence_levels (id, label, min_followers, max_followers, commission_rate, sort_order) values
  (1, 'Iniciante',      0,        9999,    0.35, 1),
  (2, 'Criador',        10000,    49999,   0.32, 2),
  (3, 'Influenciador',  50000,    249999,  0.30, 3),
  (4, 'Estrela',        250000,   999999,  0.28, 4),
  (5, 'Elite',          1000000,  null,    0.25, 5)
on conflict (id) do update set
  label = excluded.label,
  min_followers = excluded.min_followers,
  max_followers = excluded.max_followers,
  commission_rate = excluded.commission_rate,
  sort_order = excluded.sort_order;

alter table public.influence_levels enable row level security;

drop policy if exists influence_levels_select_all on public.influence_levels;
create policy influence_levels_select_all on public.influence_levels
  for select to authenticated using (true);

drop policy if exists influence_levels_admin_write on public.influence_levels;
create policy influence_levels_admin_write on public.influence_levels
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- profiles: add follower_count, free the tier column from the old constraint
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists follower_count int not null default 0;
alter table public.profiles drop constraint if exists profiles_tier_check;
alter table public.profiles alter column tier drop default;

comment on column public.profiles.follower_count is 'Total followers across connected platforms (or manual). Drives influence level + rate.';
comment on column public.profiles.tier is 'Computed influence level label (see influence_levels). Not manually set.';

-- ---------------------------------------------------------------------------
-- lookup + trigger: derive tier label and commission_rate from follower_count
-- ---------------------------------------------------------------------------
create or replace function public.influence_level_for(p_followers int)
returns public.influence_levels
language sql
stable
as $$
  select *
  from public.influence_levels
  where p_followers >= min_followers
    and (max_followers is null or p_followers <= max_followers)
  order by min_followers desc
  limit 1;
$$;

grant execute on function public.influence_level_for(int) to authenticated;

create or replace function public.apply_influence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lvl public.influence_levels;
begin
  -- Admins keep no influence level; only partners are ranked.
  if new.role = 'admin' then
    return new;
  end if;
  select * into lvl from public.influence_level_for(coalesce(new.follower_count, 0));
  if found then
    new.tier := lvl.label;
    new.commission_rate := lvl.commission_rate;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_apply_influence on public.profiles;
create trigger profiles_apply_influence
  before insert or update of follower_count, role on public.profiles
  for each row execute function public.apply_influence();

-- ---------------------------------------------------------------------------
-- Backfill demo partners with realistic follower counts (trigger recomputes
-- tier + commission_rate). Safe no-op if these handles don't exist.
-- ---------------------------------------------------------------------------
update public.profiles set follower_count = 78000   where handle = 'marina.dev';
update public.profiles set follower_count = 1250000 where handle = 'bruno.al';
update public.profiles set follower_count = 6500    where handle = 'cami.rocha';
update public.profiles set follower_count = 22000   where handle = 'dan.lemos';
update public.profiles set follower_count = 320000  where handle = 'edu.lima';
update public.profiles set follower_count = 3200    where handle = 'fabio.n';

-- Recompute everyone once (covers rows whose follower_count was already 0).
update public.profiles set follower_count = follower_count where role = 'partner';

-- ---------------------------------------------------------------------------
-- admin helper: re-apply level labels + rates to all partners (used after an
-- admin edits a band's commission_rate). SECURITY DEFINER so the trigger reads
-- the freshly-updated influence_levels.
-- ---------------------------------------------------------------------------
create or replace function public.reapply_influence_rates()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set follower_count = follower_count where role = 'partner';
end;
$$;

grant execute on function public.reapply_influence_rates() to authenticated;
