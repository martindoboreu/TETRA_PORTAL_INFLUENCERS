-- Tetra "Portal de Parceiros" — initial schema
-- Affiliate program: partners drive clicks → leads → conversions; commission is paid out periodically.
-- Buyer identities are masked at the data layer (LGPD): we never store raw email/CPF.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  role             text not null default 'partner' check (role in ('admin', 'partner')),
  full_name        text,
  handle           text unique,
  avatar_initials  text,
  tier             text default 'Prata' check (tier in ('Prata', 'Ouro', 'Diamante')),
  commission_rate  numeric not null default 0.30 check (commission_rate >= 0 and commission_rate <= 1),
  pix_key          text,
  status           text default 'pendente' check (status in ('ativo', 'pendente', 'inativo')),
  created_at       timestamptz not null default now()
);

comment on table  public.profiles is 'Per-user profile. role drives access; status gates partner access.';
comment on column public.profiles.commission_rate is 'Fraction (0.30 = 30%). Stored per-partner so tier overrides are possible.';

-- ---------------------------------------------------------------------------
-- links  (each partner owns N tracking links)
-- ---------------------------------------------------------------------------
create table if not exists public.links (
  id             uuid primary key default gen_random_uuid(),
  partner_id     uuid not null references public.profiles(id) on delete cascade,
  label          text not null,
  slug           text not null unique,
  discount_code  text unique,
  status         text not null default 'active' check (status in ('active', 'paused')),
  created_at     timestamptz not null default now()
);

create index if not exists links_partner_id_idx on public.links(partner_id);

-- ---------------------------------------------------------------------------
-- clicks
-- ---------------------------------------------------------------------------
create table if not exists public.clicks (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid not null references public.links(id) on delete cascade,
  partner_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists clicks_partner_id_created_at_idx on public.clicks(partner_id, created_at desc);
create index if not exists clicks_link_id_created_at_idx    on public.clicks(link_id,    created_at desc);

-- ---------------------------------------------------------------------------
-- leads  (a click that captured an email/phone — buyer is masked)
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.profiles(id) on delete cascade,
  link_id       uuid          references public.links(id)    on delete set null,
  buyer_masked  text,
  created_at    timestamptz not null default now()
);

create index if not exists leads_partner_id_created_at_idx on public.leads(partner_id, created_at desc);
create index if not exists leads_link_id_created_at_idx    on public.leads(link_id,    created_at desc);

-- ---------------------------------------------------------------------------
-- conversions  (a paid enrollment; commission is the partner's cut)
-- ---------------------------------------------------------------------------
create table if not exists public.conversions (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.profiles(id) on delete cascade,
  link_id       uuid          references public.links(id)    on delete set null,
  buyer_masked  text not null,
  course        text not null,
  amount        numeric not null check (amount >= 0),
  commission    numeric not null check (commission >= 0),
  status        text not null default 'confirmado' check (status in ('pago', 'confirmado', 'reembolsado')),
  payout_id     uuid,
  created_at    timestamptz not null default now()
);

create index if not exists conversions_partner_id_created_at_idx on public.conversions(partner_id, created_at desc);
create index if not exists conversions_status_idx                on public.conversions(status);
create index if not exists conversions_payout_id_idx             on public.conversions(payout_id);

-- ---------------------------------------------------------------------------
-- payouts  (a single PIX transfer covering N confirmed conversions)
-- ---------------------------------------------------------------------------
create table if not exists public.payouts (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references public.profiles(id) on delete cascade,
  amount            numeric not null check (amount >= 0),
  method            text not null default 'PIX',
  status            text not null default 'pendente' check (status in ('pendente', 'pago')),
  reference_period  text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists payouts_partner_id_created_at_idx on public.payouts(partner_id, created_at desc);

-- Now that payouts exists we can add the FK on conversions.payout_id.
alter table public.conversions
  drop constraint if exists conversions_payout_id_fkey,
  add  constraint conversions_payout_id_fkey
       foreign key (payout_id) references public.payouts(id) on delete set null;
