-- Ingestion pipeline support.
--
-- The analytics tables (clicks/leads/conversions) are written by the
-- service-role ingestion endpoints (app/api/track/*, app/r/[slug]). Webhooks
-- retry, so lead and conversion writes need an idempotency key: external_id,
-- the originating order/event id from the brand site or payment provider.
--
-- A unique (nullable) external_id lets us "insert, or no-op on conflict" and,
-- for conversions, transition status (confirmado → pago/reembolsado) by the
-- same key when the provider sends a follow-up event.

alter table public.conversions
  add column if not exists external_id text;

alter table public.leads
  add column if not exists external_id text;

-- Partial unique indexes: enforce idempotency only when an external_id is set,
-- so seed/manual rows (null) are unaffected.
create unique index if not exists conversions_external_id_key
  on public.conversions(external_id)
  where external_id is not null;

create unique index if not exists leads_external_id_key
  on public.leads(external_id)
  where external_id is not null;
