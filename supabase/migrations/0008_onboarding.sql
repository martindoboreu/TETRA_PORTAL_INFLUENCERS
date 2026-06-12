-- One-time partner onboarding (connect social at signup). Returning users are not blocked.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

comment on column public.profiles.onboarding_completed is
  'True after the partner connected at least one social account during initial onboarding.';

-- Auto-complete when first integration is saved.
create or replace function public.mark_onboarding_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set onboarding_completed = true
  where id = new.partner_id and onboarding_completed = false;
  return new;
end;
$$;

drop trigger if exists integrations_mark_onboarding on public.integrations;
create trigger integrations_mark_onboarding
  after insert on public.integrations
  for each row execute function public.mark_onboarding_complete();

-- Partners who already connected before this migration.
update public.profiles p
set onboarding_completed = true
where exists (
  select 1 from public.integrations i where i.partner_id = p.id
);
