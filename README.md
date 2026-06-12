# Tetra — Portal de Parceiros

Portal de afiliados da Tetra Educação, com dashboard para parceiros e painel administrativo, construído em Next.js (App Router) + Supabase.

- **Parceiros** acessam apenas os próprios dados (cliques, leads, conversões, comissões, repasses).
- **Administradores** gerenciam todos os parceiros, aprovam cadastros, ajustam tiers/taxas e registram repasses.
- Acesso e isolamento de dados são garantidos por **middleware** (rotas) **e RLS** (banco).
- UI em pt-BR, moeda em BRL (`R$ 1.234,56`), datas em pt-BR.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- Supabase (Postgres + Auth) via `@supabase/ssr` (cookies)
- TypeScript, Tailwind v4, shadcn/ui, lucide-react, Recharts

---

## 1. Variáveis de ambiente

Copie o exemplo e preencha com os valores do seu projeto Supabase (Project Settings → API):

```bash
cp .env.local.example .env.local
```

| Variável | Onde usar | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente + servidor | chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | **somente servidor** | chave de serviço; nunca importar em componentes `'use client'` |

> A service-role key só é lida por `lib/supabase/admin.ts` (marcado com `import 'server-only'`). Ela nunca chega ao bundle do navegador.

---

## 2. Banco de dados — migrações

As migrações ficam em `supabase/migrations/` e devem ser aplicadas em ordem:

- `0001_init.sql` — tabelas, índices e constraints
- `0002_rls.sql` — RLS, helpers de role, trigger de criação de perfil
- `0003_views.sql` — `program_settings` + funções de KPI (parceiro e admin)

### Com a Supabase CLI

```bash
supabase db push
```

### Ou manualmente

Cole o conteúdo de cada arquivo, na ordem, no **SQL Editor** do painel Supabase e execute.

---

## 3. Seed (dados de demonstração)

`supabase/seed.sql` cria 1 admin + 6 parceiros (incl. uma conta pendente) com ~90 dias de cliques/leads/conversões realistas e alguns repasses.

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

Ou cole `supabase/seed.sql` no SQL Editor e execute.

> O seed insere diretamente em `auth.users`. Se preferir criar os usuários pelo painel, comente a seção "auth.users INSERT" e crie usuários com os mesmos UUIDs listados no topo do arquivo.

### Credenciais de demonstração

Todas com a senha `Demo1234!`:

| E-mail | Papel | Situação |
|---|---|---|
| `admin@tetraeducacao.com.br` | admin | — |
| `marina@tetraeducacao.com.br` | partner (Tetra Signature) | ativo |
| `bruno@tetraeducacao.com.br` | partner (Tetra Circle) | ativo |
| `camila@tetraeducacao.com.br` | partner (Tetra Select) | ativo |
| `daniel@tetraeducacao.com.br` | partner (Tetra Select) | ativo |
| `eduarda@tetraeducacao.com.br` | partner (Tetra Council) | ativo |
| `fabio@tetraeducacao.com.br` | partner (Tetra Select) | pendente |

- Admin → `/admin`
- Parceiro ativo → `/dashboard`
- Parceiro pendente/inativo → `/conta-em-analise`

---

## 4. Rodar a aplicação

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Scripts úteis:

```bash
pnpm typecheck    # tsc --noEmit
pnpm build        # build de produção
pnpm lint         # eslint
```

---

## 5. Promover um usuário a admin

O cadastro não concede acesso automático: novos usuários nascem como `partner` / `pendente` (via trigger `on_auth_user_created`). Para tornar alguém admin, rode no SQL Editor:

```sql
update public.profiles
set role = 'admin', status = 'ativo'
where id = (select id from auth.users where email = 'pessoa@empresa.com');
```

Para aprovar um parceiro pendente, use o painel (`/admin/parceiros` → **Aprovar**) ou:

```sql
update public.profiles set status = 'ativo'
where id = (select id from auth.users where email = 'parceiro@empresa.com');
```

---

## Estrutura

```
app/
  (auth)/actions.ts          # signIn, signOut, savePartnerProfile (Server Actions)
  page.tsx                   # login
  conta-em-analise/          # estado "conta em análise"
  dashboard/                 # portal do parceiro
  admin/                     # portal do administrador
    actions.ts               # aprovar/editar parceiro, marcar repasse, settings
    repasses/export/route.ts # exportação CSV
components/                  # UI compartilhada (sidebar, gráficos, tabelas, ações admin)
lib/
  supabase/                  # clients server/browser/admin + middleware
  queries/                   # camada de dados tipada (partner.ts, admin.ts, range.ts)
  database.types.ts          # tipos do schema (espelho das migrações)
  format.ts                  # formatação BRL / datas pt-BR
supabase/
  migrations/                # 0001_init, 0002_rls, 0003_views
  seed.sql                   # dados de demonstração
middleware.ts                # guarda de rotas por papel/status
```

---

## Notas de segurança (LGPD)

- Compradores são armazenados **mascarados** (`L. Pereira`). E-mail/CPF brutos nunca são gravados em tabelas visíveis ao parceiro.
- RLS garante que parceiros leiam apenas as próprias linhas; cliques/leads/conversões são gravados via service-role (pipeline de ingestão), não pelo navegador.
- Nenhum estado de aplicação usa `localStorage`/`sessionStorage`.
