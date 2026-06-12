-- Admins must never be blocked by partner onboarding or pending status.
update public.profiles
set
  role = 'admin',
  status = 'ativo',
  onboarding_completed = true
where role = 'admin';

-- Ensure admin rows stay active when role is promoted.
create or replace function public.ensure_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin' then
    new.status := 'ativo';
    new.onboarding_completed := true;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_ensure_admin on public.profiles;
create trigger profiles_ensure_admin
  before insert or update of role on public.profiles
  for each row execute function public.ensure_admin_profile();
