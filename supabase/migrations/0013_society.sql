-- 0013_society.sql — Tetra Society: an invitation-based partner status system that
-- replaces the follower-driven influence levels and the seasonal prize ladder.
--
-- Status is GRANTED BY THE TEAM (admin), never auto-unlocked. Each tier carries its
-- own commission rate. profiles.society_tier is the source of truth; a trigger mirrors
-- the tier's display name into profiles.tier and its rate into profiles.commission_rate
-- (so existing RPCs that read profiles.tier keep working).
--
-- The old influence_levels / reward_tiers tables are left in place but are no longer
-- read by the app.

-- ---------------------------------------------------------------------------
-- society_tiers — the four statuses (admin-configurable commission rate)
-- ---------------------------------------------------------------------------
create table if not exists public.society_tiers (
  id              smallint primary key,
  key             text not null unique check (key in ('select','signature','circle','council')),
  name            text not null,
  description     text not null,
  commission_rate numeric not null check (commission_rate >= 0 and commission_rate <= 1),
  invite_only     boolean not null default false,
  sort_order      smallint not null default 0
);

insert into public.society_tiers (id, key, name, description, commission_rate, invite_only, sort_order) values
  (1, 'select',    'Tetra Select',    'Parceiro aprovado. Acesso a campanhas base, link pessoal, cupom, biblioteca de conteúdo e comissão base.', 0.30, false, 1),
  (2, 'signature', 'Tetra Signature', 'Parceiro validado. Comissão ampliada, acesso antecipado a campanhas, briefings avançados, briefings mensais e campanhas prioritárias.', 0.32, false, 2),
  (3, 'circle',    'Tetra Circle',    'Parceiro estratégico do círculo interno. Landing pages personalizadas, drops premium, suporte prioritário, kit físico de boas-vindas, calls privadas e analytics avançado.', 0.35, false, 3),
  (4, 'council',   'Tetra Council',   'Nível de parceiro/conselheiro, apenas por convite. Campanhas co-criadas, contratos especiais, acesso à direção, eventos e oportunidades estratégicas privadas.', 0.38, true, 4)
on conflict (id) do update set
  key = excluded.key,
  name = excluded.name,
  description = excluded.description,
  commission_rate = excluded.commission_rate,
  invite_only = excluded.invite_only,
  sort_order = excluded.sort_order;

alter table public.society_tiers enable row level security;

drop policy if exists society_tiers_select_all on public.society_tiers;
create policy society_tiers_select_all on public.society_tiers
  for select to authenticated using (true);

drop policy if exists society_tiers_admin_write on public.society_tiers;
create policy society_tiers_admin_write on public.society_tiers
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- profiles.society_tier — current status (default Select on approval)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists society_tier text not null default 'select';
alter table public.profiles drop constraint if exists profiles_society_tier_check;
alter table public.profiles add constraint profiles_society_tier_check
  check (society_tier in ('select','signature','circle','council'));

comment on column public.profiles.society_tier is 'Tetra Society status key. Granted by admin invitation; drives tier label + commission_rate.';

-- ---------------------------------------------------------------------------
-- partner_evaluations — admin-scored qualitative criteria for invitations
-- ---------------------------------------------------------------------------
create table if not exists public.partner_evaluations (
  partner_id             uuid primary key references public.profiles(id) on delete cascade,
  approved_content_count int not null default 0 check (approved_content_count >= 0),
  compliance_score       smallint not null default 0 check (compliance_score between 0 and 100),
  content_quality_score  smallint not null default 0 check (content_quality_score between 0 and 100),
  responsiveness_score   smallint not null default 0 check (responsiveness_score between 0 and 100),
  notes                  text,
  updated_at             timestamptz not null default now()
);

alter table public.partner_evaluations enable row level security;

drop policy if exists partner_evaluations_select_own_or_admin on public.partner_evaluations;
create policy partner_evaluations_select_own_or_admin on public.partner_evaluations
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists partner_evaluations_write_admin on public.partner_evaluations;
create policy partner_evaluations_write_admin on public.partner_evaluations
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Commission now follows the Society tier, not follower count.
-- Drop the influence trigger; add a society trigger.
-- ---------------------------------------------------------------------------
drop trigger if exists profiles_apply_influence on public.profiles;

create or replace function public.apply_society_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.society_tiers;
begin
  -- Admins are not ranked.
  if new.role = 'admin' then
    return new;
  end if;
  select * into t from public.society_tiers where key = new.society_tier;
  if found then
    new.tier := t.name;
    new.commission_rate := t.commission_rate;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_apply_society on public.profiles;
create trigger profiles_apply_society
  before insert or update of society_tier, role on public.profiles
  for each row execute function public.apply_society_tier();

-- Re-apply tier rates to every partner (used after an admin edits a tier's rate).
create or replace function public.reapply_society_rates()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set society_tier = society_tier where role = 'partner';
end;
$$;

grant execute on function public.reapply_society_rates() to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill existing partners (safe no-op on a fresh DB where seed runs later).
-- Distribute demo partners so locked/unlocked states are visible.
-- ---------------------------------------------------------------------------
update public.profiles set society_tier = 'select'    where role = 'partner';
update public.profiles set society_tier = 'signature' where handle = 'marina.dev';
update public.profiles set society_tier = 'circle'    where handle = 'bruno.al';
update public.profiles set society_tier = 'council'   where handle = 'edu.lima';

-- Demo evaluations for existing partners (idempotent).
insert into public.partner_evaluations
  (partner_id, approved_content_count, compliance_score, content_quality_score, responsiveness_score, notes)
select p.id,
  case p.handle when 'marina.dev' then 24 when 'bruno.al' then 41 when 'cami.rocha' then 9 when 'dan.lemos' then 6 else 0 end,
  case p.handle when 'marina.dev' then 96 when 'bruno.al' then 92 when 'cami.rocha' then 80 when 'dan.lemos' then 78 else 70 end,
  case p.handle when 'marina.dev' then 90 when 'bruno.al' then 94 when 'cami.rocha' then 75 when 'dan.lemos' then 72 else 70 end,
  case p.handle when 'marina.dev' then 88 when 'bruno.al' then 85 when 'cami.rocha' then 82 when 'dan.lemos' then 68 else 70 end,
  null
from public.profiles p
where p.role = 'partner'
on conflict (partner_id) do nothing;
