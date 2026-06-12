-- 0010_campaigns.sql — Campaign briefs partners can promote, plus per-partner participation state.
--
-- campaigns           : the brief itself (admin-authored). Partners see active ones.
-- campaign_participants: a partner's relationship to a campaign (convidado/aceito/entregue).

create table if not exists public.campaigns (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  subtitle             text,
  brief                text,
  commission_note      text,
  content_requirements text,
  reward_highlight     text,
  deadline             date,
  status               text not null default 'rascunho' check (status in ('rascunho','ativa','encerrada')),
  sort_order           int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.campaign_participants (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  partner_id  uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'convidado' check (status in ('convidado','aceito','entregue')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (campaign_id, partner_id)
);

create index if not exists campaign_participants_partner_idx on public.campaign_participants(partner_id);
create index if not exists campaign_participants_campaign_idx on public.campaign_participants(campaign_id);

alter table public.campaigns             enable row level security;
alter table public.campaign_participants enable row level security;

-- Partners may read active campaigns; admins read everything.
drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns
  for select to authenticated
  using (status = 'ativa' or (select public.is_admin()));

drop policy if exists campaigns_write_admin on public.campaigns;
create policy campaigns_write_admin on public.campaigns
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Participants: a partner sees/updates only their own row; admins manage all.
drop policy if exists campaign_participants_select on public.campaign_participants;
create policy campaign_participants_select on public.campaign_participants
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists campaign_participants_insert_own on public.campaign_participants;
create policy campaign_participants_insert_own on public.campaign_participants
  for insert to authenticated
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists campaign_participants_update_own on public.campaign_participants;
create policy campaign_participants_update_own on public.campaign_participants
  for update to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists campaign_participants_write_admin on public.campaign_participants;
create policy campaign_participants_write_admin on public.campaign_participants
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists campaigns_touch on public.campaigns;
create trigger campaigns_touch before update on public.campaigns
  for each row execute function public.touch_updated_at();

drop trigger if exists campaign_participants_touch on public.campaign_participants;
create trigger campaign_participants_touch before update on public.campaign_participants
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Demo content (idempotent): two active campaigns + auto-invite active partners
-- ---------------------------------------------------------------------------
insert into public.campaigns (id, title, subtitle, brief, commission_note, content_requirements, reward_highlight, deadline, status, sort_order)
values
  (
    'c0000001-0000-0000-0000-000000000001',
    'Matrículas 2026 · Pós-Graduação',
    'Campanha de captação para o ciclo 2026.1',
    'Divulgue os cursos de pós-graduação da Tetra com foco em profissionais que buscam recolocação. Destaque a flexibilidade do EAD e o corpo docente.',
    'Comissão do seu status na Tetra Society aplicada a cada matrícula confirmada.',
    'Mínimo de 2 stories + 1 post no feed. Use a hashtag #TetraPós e marque @tetraeducacao.',
    'Bônus de R$ 500 ao atingir 10 matrículas no período.',
    (now() + interval '30 days')::date,
    'ativa',
    1
  ),
  (
    'c0000002-0000-0000-0000-000000000002',
    'Cursos Livres · Verão Tetra',
    'Promoção sazonal de cursos de curta duração',
    'Cupom exclusivo de verão para cursos livres. Ideal para audiências que querem aprender algo novo em poucas semanas.',
    'Comissão do seu nível + cupom de 15% para sua audiência.',
    '1 reel mostrando um curso à sua escolha. Link na bio durante a vigência.',
    'Os 3 parceiros com mais conversões ganham um kit Tetra.',
    (now() + interval '20 days')::date,
    'ativa',
    2
  )
on conflict (id) do nothing;

insert into public.campaign_participants (campaign_id, partner_id, status)
select c.id, p.id, 'convidado'
from public.campaigns c
cross join public.profiles p
where c.status = 'ativa' and p.role = 'partner' and p.status = 'ativo'
on conflict (campaign_id, partner_id) do nothing;
