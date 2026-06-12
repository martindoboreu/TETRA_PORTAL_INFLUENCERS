-- Seed for the Tetra "Portal de Parceiros" demo.
--
-- IMPORTANT — read README.md first.
--
-- This seed inserts directly into auth.users to give you a working demo with
-- one click. That pattern is supported by Supabase but is internal-API-sensitive:
-- if you'd rather provision users through the dashboard, comment out the
-- "auth.users INSERT" section below and create matching users by hand using the
-- UUIDs at the top of this file.
--
-- After running this seed you can log in with any of these credentials:
--
--   admin@tetraeducacao.com.br   / Demo1234!   (role: admin)
--   marina@tetraeducacao.com.br  / Demo1234!   (Ouro,     ativo)
--   bruno@tetraeducacao.com.br   / Demo1234!   (Diamante, ativo)
--   camila@tetraeducacao.com.br  / Demo1234!   (Prata,    ativo)
--   daniel@tetraeducacao.com.br  / Demo1234!   (Prata,    ativo)
--   eduarda@tetraeducacao.com.br / Demo1234!   (Ouro,     inativo)
--   fabio@tetraeducacao.com.br   / Demo1234!   (Prata,    pendente)
--

do $seed$
declare
  admin_id    constant uuid := '11111111-1111-1111-1111-111111111111';
  marina_id   constant uuid := '22222222-2222-2222-2222-222222222222';
  bruno_id    constant uuid := '33333333-3333-3333-3333-333333333333';
  camila_id   constant uuid := '44444444-4444-4444-4444-444444444444';
  daniel_id   constant uuid := '55555555-5555-5555-5555-555555555555';
  eduarda_id  constant uuid := '66666666-6666-6666-6666-666666666666';
  fabio_id    constant uuid := '77777777-7777-7777-7777-777777777777';

  password_hash text := crypt('Demo1234!', gen_salt('bf'));

  -- (id, email, full_name, handle, initials, role, tier, rate, status)
  users constant text[][] := array[
    [admin_id::text,   'admin@tetraeducacao.com.br',   'Equipe Tetra',    'tetra.team',  'TT', 'admin',   'Ouro',     '0.30', 'ativo'],
    [marina_id::text,  'marina@tetraeducacao.com.br',  'Marina Castro',   'marina.dev',  'MC', 'partner', 'Ouro',     '0.30', 'ativo'],
    [bruno_id::text,   'bruno@tetraeducacao.com.br',   'Bruno Almeida',   'bruno.al',    'BA', 'partner', 'Diamante', '0.35', 'ativo'],
    [camila_id::text,  'camila@tetraeducacao.com.br',  'Camila Rocha',    'cami.rocha',  'CR', 'partner', 'Prata',    '0.28', 'ativo'],
    [daniel_id::text,  'daniel@tetraeducacao.com.br',  'Daniel Lemos',    'dan.lemos',   'DL', 'partner', 'Prata',    '0.25', 'ativo'],
    [eduarda_id::text, 'eduarda@tetraeducacao.com.br', 'Eduarda Lima',    'edu.lima',    'EL', 'partner', 'Ouro',     '0.30', 'inativo'],
    [fabio_id::text,   'fabio@tetraeducacao.com.br',   'Fábio Nogueira',  'fabio.n',     'FN', 'partner', 'Prata',    '0.25', 'pendente']
  ];

  -- Parallel arrays for course/price lookups
  course_names constant text[]    := array['Curso completo de IA','Excel Avançado','Power BI','Inglês Corporativo','MBA BI & Analytics','Pós Gestão e IA'];
  course_pmin  constant numeric[] := array[800, 300, 400, 500, 1400, 1000];
  course_pmax  constant numeric[] := array[1200, 500, 700, 900, 1800, 1500];

  buyer_pool constant text[] := array[
    'L. Pereira','R. Santos','J. Oliveira','A. Costa','C. Prado','M. Sousa','T. Gomes',
    'P. Ribeiro','N. Cardoso','V. Araújo','I. Mendes','F. Barbosa','G. Nascimento',
    'B. Carvalho','D. Souza','S. Andrade','E. Pinto','H. Moreira','K. Dias','O. Cunha'
  ];

  -- Active partners and per-partner click intensity / commission rate
  active_ids   uuid[]    := array[marina_id, bruno_id, camila_id, daniel_id];
  active_base  int[]     := array[140, 95, 55, 35];
  active_rate  numeric[] := array[0.30, 0.35, 0.28, 0.25];

  u text[];
  day_offset    int;
  d             date;
  is_weekend    boolean;
  p_ix          int;
  partner_uuid  uuid;
  partner_rate  numeric;
  base_clicks   int;
  day_clicks    int;
  day_leads     int;
  day_conv      int;
  i             int;
  link_ids      uuid[];
  picked_link   uuid;
  course_ix     int;
  price         numeric;
  conv_buyer    text;
  conv_ts       timestamptz;
  conv_status   text;
begin
  -- =========================================================================
  -- auth.users  (delete any prior demo users, then re-insert)
  -- =========================================================================
  delete from auth.users where id = any (array[
    admin_id, marina_id, bruno_id, camila_id, daniel_id, eduarda_id, fabio_id
  ]);

  foreach u slice 1 in array users loop
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      u[1]::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated', 'authenticated',
      u[2], password_hash, now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', u[3]),
      now() - interval '120 days', now(),
      '', '', '', ''
    );
  end loop;

  -- =========================================================================
  -- profiles  (the on_auth_user_created trigger inserted defaults; refine here)
  -- =========================================================================
  foreach u slice 1 in array users loop
    update public.profiles
       set role            = u[6],
           full_name       = u[3],
           handle          = u[4],
           avatar_initials = u[5],
           tier            = u[7],
           commission_rate = u[8]::numeric,
           status          = u[9],
           pix_key         = case when u[6] = 'partner' then u[2] else null end
     where id = u[1]::uuid;
  end loop;

  -- =========================================================================
  -- links
  -- =========================================================================
  delete from public.links where partner_id = any (array[
    marina_id, bruno_id, camila_id, daniel_id, eduarda_id, fabio_id
  ]);

  insert into public.links (id, partner_id, label, slug, discount_code, status, created_at) values
    ('a0000001-0000-0000-0000-000000000001', marina_id,  'Bio Instagram (@marina.dev)',  'marina',         'MARINA10',   'active', now() - interval '110 days'),
    ('a0000001-0000-0000-0000-000000000002', marina_id,  'Reel "Parei de usar no-code"', 'marina-nocode',  'NOCODE15',   'active', now() - interval  '85 days'),
    ('a0000001-0000-0000-0000-000000000003', marina_id,  'Descrição YouTube',            'marina-yt',      'MARINAYT',   'active', now() - interval  '60 days'),
    ('a0000001-0000-0000-0000-000000000004', marina_id,  'Newsletter',                   'marina-news',    'NEWSLETTER', 'paused', now() - interval  '40 days'),
    ('b0000002-0000-0000-0000-000000000001', bruno_id,   'LinkedIn newsletter',          'bruno-li',       'BRUNO10',    'active', now() - interval '100 days'),
    ('b0000002-0000-0000-0000-000000000002', bruno_id,   'Bio TikTok',                   'bruno-tt',       'BRUNOTT',    'active', now() - interval  '70 days'),
    ('b0000002-0000-0000-0000-000000000003', bruno_id,   'Podcast Dados ao Vivo',        'bruno-pod',      'PODCAST20',  'active', now() - interval  '55 days'),
    ('c0000003-0000-0000-0000-000000000001', camila_id,  'Blog próprio',                 'cami-blog',      'CAMI10',     'active', now() - interval  '90 days'),
    ('c0000003-0000-0000-0000-000000000002', camila_id,  'Comunidade Excel BR',          'cami-excel',     'EXCELBR',    'active', now() - interval  '45 days'),
    ('d0000004-0000-0000-0000-000000000001', daniel_id,  'Email signature',              'dan-sig',        'DAN10',      'active', now() - interval  '80 days'),
    ('d0000004-0000-0000-0000-000000000002', daniel_id,  'Grupo WhatsApp BI',            'dan-wpp',        'WPPBI',      'active', now() - interval  '50 days'),
    ('e0000005-0000-0000-0000-000000000001', eduarda_id, 'Instagram (@edu.lima)',        'edu',            'EDU10',      'paused', now() - interval  '95 days');

  -- =========================================================================
  -- 90 days of clicks / leads / conversions
  -- (pendente Fábio + inativo Eduarda get no traffic)
  -- =========================================================================
  delete from public.conversions where partner_id = any (active_ids);
  delete from public.leads       where partner_id = any (active_ids);
  delete from public.clicks      where partner_id = any (active_ids);

  for day_offset in 0..89 loop
    d := (current_date - day_offset);
    is_weekend := extract(dow from d) in (0, 6);

    for p_ix in 1..array_length(active_ids, 1) loop
      partner_uuid := active_ids[p_ix];
      base_clicks  := active_base[p_ix];
      partner_rate := active_rate[p_ix];

      day_clicks := round(
        base_clicks
        * (case when is_weekend then 0.65 else 1.0 end)
        * (0.75 + random() * 0.5)
      );

      select array_agg(id) into link_ids
        from public.links where partner_id = partner_uuid and status = 'active';

      if link_ids is null or coalesce(array_length(link_ids, 1), 0) = 0 then
        continue;
      end if;

      for i in 1..day_clicks loop
        picked_link := link_ids[1 + floor(random() * array_length(link_ids, 1))::int];
        insert into public.clicks (link_id, partner_id, created_at)
        values (picked_link, partner_uuid, d::timestamptz + (random() * interval '24 hours'));
      end loop;

      day_leads := greatest(0, round(day_clicks * (0.12 + random() * 0.06)));
      for i in 1..day_leads loop
        picked_link := link_ids[1 + floor(random() * array_length(link_ids, 1))::int];
        insert into public.leads (link_id, partner_id, buyer_masked, created_at) values (
          picked_link, partner_uuid,
          buyer_pool[1 + floor(random() * array_length(buyer_pool, 1))::int],
          d::timestamptz + (random() * interval '24 hours')
        );
      end loop;

      day_conv := greatest(0, round(day_leads * (0.10 + random() * 0.06)));
      for i in 1..day_conv loop
        picked_link := link_ids[1 + floor(random() * array_length(link_ids, 1))::int];
        course_ix   := 1 + floor(random() * array_length(course_names, 1))::int;
        price       := course_pmin[course_ix] + random() * (course_pmax[course_ix] - course_pmin[course_ix]);
        conv_buyer  := buyer_pool[1 + floor(random() * array_length(buyer_pool, 1))::int];
        conv_ts     := d::timestamptz + (random() * interval '24 hours');

        if random() < 0.04 then
          conv_status := 'reembolsado';
        elsif day_offset > 35 then
          conv_status := 'pago';
        else
          conv_status := 'confirmado';
        end if;

        insert into public.conversions (
          partner_id, link_id, buyer_masked, course, amount, commission, status, created_at
        ) values (
          partner_uuid, picked_link, conv_buyer, course_names[course_ix],
          round(price::numeric, 2),
          round((price * partner_rate)::numeric, 2),
          conv_status,
          conv_ts
        );
      end loop;
    end loop;
  end loop;

  -- =========================================================================
  -- past payouts: bundle each partner's "pago" conversions into a monthly row
  -- =========================================================================
  delete from public.payouts where partner_id = any (active_ids);

  for p_ix in 1..array_length(active_ids, 1) loop
    partner_uuid := active_ids[p_ix];
    insert into public.payouts (partner_id, amount, method, status, reference_period, paid_at, created_at)
    select
      partner_uuid,
      round(sum(commission)::numeric, 2),
      'PIX',
      'pago',
      to_char(date_trunc('month', created_at), 'TMMon YYYY'),
      (date_trunc('month', created_at) + interval '1 month + 4 days')::timestamptz,
      (date_trunc('month', created_at) + interval '1 month + 4 days')::timestamptz
    from public.conversions
    where partner_id = partner_uuid and status = 'pago' and payout_id is null
    group by date_trunc('month', created_at)
    having sum(commission) > 0
    order by date_trunc('month', created_at);
  end loop;

  -- attach payout_id back to each conversion in the matching month
  update public.conversions c
     set payout_id = p.id
    from public.payouts p
   where c.partner_id = p.partner_id
     and c.status = 'pago'
     and c.payout_id is null
     and date_trunc('month', c.created_at) =
         date_trunc('month', p.paid_at - interval '1 month - 4 days');
end;
$seed$;

update public.program_settings
   set next_payout_date = (date_trunc('month', current_date) + interval '1 month + 4 days')::date,
       updated_at       = now()
 where id = 1;

-- ---------------------------------------------------------------------------
-- Campaigns & notifications demo wiring (campaigns/assets rows come from the
-- 0010/0011 migrations). On a fresh `db reset` migrations run before this seed,
-- so profiles don't exist yet when those migrations try to invite participants —
-- we backfill participation + notifications here, after profiles are created.
-- ---------------------------------------------------------------------------
insert into public.campaign_participants (campaign_id, partner_id, status)
select c.id, p.id, 'convidado'
from public.campaigns c
cross join public.profiles p
where c.status = 'ativa' and p.role = 'partner' and p.status = 'ativo'
on conflict (campaign_id, partner_id) do nothing;

insert into public.notifications (partner_id, type, title, body, href)
select p.id, 'campaign', 'Nova campanha disponível',
       'A campanha "Matrículas 2026 · Pós-Graduação" já está ativa. Confira o briefing.',
       '/dashboard/campanhas'
from public.profiles p
where p.role = 'partner' and p.status = 'ativo'
  and not exists (select 1 from public.notifications n where n.partner_id = p.id);

-- ---------------------------------------------------------------------------
-- Tetra Society demo distribution. Assigning society_tier fires the
-- apply_society_tier trigger, which mirrors the tier name + commission rate
-- onto each profile (overriding the legacy Ouro/Prata values set above).
-- ---------------------------------------------------------------------------
update public.profiles set society_tier = 'select'    where role = 'partner';
update public.profiles set society_tier = 'signature' where handle = 'marina.dev';
update public.profiles set society_tier = 'circle'    where handle = 'bruno.al';
update public.profiles set society_tier = 'council'   where handle = 'edu.lima';

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
on conflict (partner_id) do update set
  approved_content_count = excluded.approved_content_count,
  compliance_score = excluded.compliance_score,
  content_quality_score = excluded.content_quality_score,
  responsiveness_score = excluded.responsiveness_score;
