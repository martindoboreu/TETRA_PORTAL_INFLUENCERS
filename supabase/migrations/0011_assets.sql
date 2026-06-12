-- 0011_assets.sql — Content assets partners can use: creatives, captions, brand guides, post examples.
-- Admin-curated; every partner can read. File binaries live in Supabase Storage; we store URLs.

create table if not exists public.assets (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('criativo','legenda','guia','exemplo')),
  title       text not null,
  description text,
  file_url    text,
  caption_text text,
  course      text,
  format      text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists assets_category_idx on public.assets(category);

alter table public.assets enable row level security;

drop policy if exists assets_select_all on public.assets;
create policy assets_select_all on public.assets
  for select to authenticated
  using (true);

drop policy if exists assets_write_admin on public.assets;
create policy assets_write_admin on public.assets
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Demo content (idempotent)
-- ---------------------------------------------------------------------------
insert into public.assets (id, category, title, description, caption_text, course, format, sort_order)
values
  ('a0000001-0000-0000-0000-000000000001', 'guia', 'Manual da Marca Tetra', 'Cores, logos e tom de voz para suas publicações.', null, null, 'PDF', 1),
  ('a0000002-0000-0000-0000-000000000002', 'guia', 'Boas práticas de divulgação', 'O que pode e o que evitar ao promover a Tetra.', null, null, 'PDF', 2),
  ('a0000003-0000-0000-0000-000000000003', 'legenda', 'Legenda · Pós-Graduação', 'Sugestão pronta para post no feed.', 'Quer dar o próximo passo na carreira? A pós EAD da Tetra tem flexibilidade e professores que são referência no mercado. Use meu link e garanta condição especial. #TetraPós', 'Pós-Graduação', 'Texto', 3),
  ('a0000004-0000-0000-0000-000000000004', 'legenda', 'Legenda · Cursos Livres', 'Sugestão para stories.', 'Aprender algo novo não precisa ser complicado 😉 Os cursos livres da Tetra cabem na sua rotina. Link na bio com cupom de verão!', 'Cursos Livres', 'Texto', 4),
  ('a0000005-0000-0000-0000-000000000005', 'exemplo', 'Exemplo de Reel aprovado', 'Referência de formato que converte bem.', null, null, 'Vídeo', 5),
  ('a0000006-0000-0000-0000-000000000006', 'criativo', 'Pack de imagens · Pós 2026', 'Artes para feed e stories no formato 1080x1920.', null, 'Pós-Graduação', 'ZIP', 6)
on conflict (id) do nothing;
