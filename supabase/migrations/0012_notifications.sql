-- 0012_notifications.sql — Per-partner notifications surfaced in the header bell.
-- Rows are created by admin actions (approval, payout marked paid, campaign invite)
-- and by seed/demo data. Partners read and mark their own as read.

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  type       text not null default 'info' check (type in ('info','payout','campaign','approval','milestone')),
  title      text not null,
  body       text,
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_partner_idx on public.notifications(partner_id, created_at desc);

alter table public.notifications enable row level security;

-- Partner reads own notifications; admins can read all.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

-- Partner can mark own notifications read (update); admins manage all.
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists notifications_write_admin on public.notifications;
create policy notifications_write_admin on public.notifications
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Demo content (idempotent-ish): a welcome + campaign notice for active partners
-- who don't have any notification yet.
-- ---------------------------------------------------------------------------
insert into public.notifications (partner_id, type, title, body, href)
select p.id, 'campaign', 'Nova campanha disponível',
       'A campanha "Matrículas 2026 · Pós-Graduação" já está ativa. Confira o briefing.',
       '/dashboard/campanhas'
from public.profiles p
where p.role = 'partner' and p.status = 'ativo'
  and not exists (select 1 from public.notifications n where n.partner_id = p.id);
