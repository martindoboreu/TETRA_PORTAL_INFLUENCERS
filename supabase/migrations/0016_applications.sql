-- Public affiliate applications: self-reported qualification info captured at
-- signup (/aplicar) so admins can qualify micro-influencers before approving.
-- Additive and nullable — existing rows and flows are unaffected.

alter table public.profiles
  add column if not exists primary_social    text,
  add column if not exists application_pitch text;

comment on column public.profiles.primary_social is
  'Self-reported main channel at application, e.g. "Instagram @handle · 12k".';
comment on column public.profiles.application_pitch is
  'Free-text "why you" / audience description from the public application form.';
