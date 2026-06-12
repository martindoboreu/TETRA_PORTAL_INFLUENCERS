-- 0007_integrations.sql — External platform connections (Meta, Instagram, Google, YouTube, TikTok).
-- Follower counts pulled from connected platforms roll up into profiles.follower_count,
-- which (via 0005) recomputes the partner's influence level + commission rate.
--
-- Tokens are stored here but NEVER selected by client code — only server-side adapters read them.

create table if not exists public.integrations (
  id                  uuid primary key default gen_random_uuid(),
  partner_id          uuid not null references public.profiles(id) on delete cascade,
  provider            text not null check (provider in ('meta','instagram','google','youtube','tiktok')),
  status              text not null default 'connected' check (status in ('connected','disconnected')),
  external_handle     text,
  external_account_id text,
  follower_count      int not null default 0,
  access_token        text,
  refresh_token       text,
  scope               text,
  connected_at        timestamptz not null default now(),
  last_synced_at      timestamptz,
  unique (partner_id, provider)
);

create index if not exists integrations_partner_id_idx on public.integrations(partner_id);

alter table public.integrations enable row level security;

drop policy if exists integrations_select_own_or_admin on public.integrations;
create policy integrations_select_own_or_admin on public.integrations
  for select to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists integrations_write_own_or_admin on public.integrations;
create policy integrations_write_own_or_admin on public.integrations
  for all to authenticated
  using (partner_id = (select auth.uid()) or (select public.is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- roll connected followers up into profiles.follower_count
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_followers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.partner_id, old.partner_id);
  total int;
begin
  select coalesce(sum(follower_count), 0) into total
  from public.integrations
  where partner_id = pid and status = 'connected';

  update public.profiles set follower_count = total where id = pid;
  return null;
end;
$$;

drop trigger if exists integrations_sync_followers on public.integrations;
create trigger integrations_sync_followers
  after insert or update or delete on public.integrations
  for each row execute function public.sync_profile_followers();
