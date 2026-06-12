# Traffic simulation — end-to-end analytics test

Drives realistic volume through the **real** ingestion endpoints
(`/r/[slug]`, `/api/track/lead`, `/api/track/conversion`) so the partner and
admin dashboards fill with data that traveled the exact same code path as
production traffic. A visitor clicks an influencer's link → it's recorded →
some become leads → some convert → it all shows up on the dashboards.

## Safety model

All simulated traffic flows through clearly-tagged **`[SIM]` QA influencers**
that the harness creates. Every row is isolated under known partner IDs, so
`sim:cleanup` removes it precisely — **real partners are never touched.**

> The endpoints write to whatever `NEXT_PUBLIC_SUPABASE_URL` points at. If
> that's production, the QA influencers live there until you run cleanup. For a
> fully throwaway environment, point `.env.local` at a separate Supabase
> project (or `supabase start` once Docker is available) and re-run.

## Prerequisites

1. `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   and `TETRA_INGEST_KEY`.
2. Migration `0014_ingestion.sql` is applied to that database.
3. The portal dev server is running and pointed at the same database:
   ```bash
   npm run dev            # http://localhost:3000
   ```
   If your server runs on another port, pass `--base`:
   ```bash
   SIM_BASE_URL=http://localhost:3457 npm run sim:run
   ```

## Run it

```bash
npm run sim:setup -- --scale=realistic   # create [SIM] influencers + links
npm run sim:run   -- --scale=realistic   # fire traffic through the endpoints
npm run sim:verify                        # read back via dashboard RPCs + assert
```

Or all three at once: `npm run sim -- --scale=realistic`.

Then **watch it live**:
- **Admin dashboard** (`/admin`, `/admin/parceiros`) — the `[SIM]` influencers
  appear in the roster with clicks, conversions and commission.
- **Partner dashboard** — log in as any QA influencer
  (`sim+marina@tetra.test` … password `SimDemo1234!`, override with
  `SIM_PARTNER_PASSWORD`) to see their funnel, link table and earnings.

## Scale presets

| scale | influencers | ~visitors | concurrency | use |
|-------|-------------|-----------|-------------|-----|
| `micro` | 1 | ~30 | 8 | smoke test |
| `small` | 3 | ~750 | 24 | quick check |
| `realistic` | 5 | ~7,000 | 40 | demo / QA |
| `heavy` | 5 | ~26,000 | 60 | load test |

## What it exercises

- **Clicks** via `/r/{slug}` (with UTM passthrough), recorded before redirect.
- **Leads** and **conversions** via the ingestion API with the shared secret.
- **Commission** computed server-side — `verify` asserts `commission = amount ×
  partner rate` to the cent for every conversion.
- **Idempotency** — a fraction of orders are POSTed twice; `verify` asserts no
  duplicate rows.
- **Refunds** — follow-up events flip status to `reembolsado` on the same order.
- **Coupon-only attribution** (no ref cookie) and **bogus-coupon noise** (the
  `attributed:false` path).
- **The funnel invariants** — leads ≤ clicks, matrículas ≤ leads — read back
  through the same RPCs the dashboards use.

## Clean up

```bash
npm run sim:cleanup                 # delete events + links + QA users (total)
npm run sim:cleanup -- --events-only # keep the influencers, wipe traffic only
```

`sim:cleanup` reports the row counts it deletes and removes the manifest, so
the database returns to exactly its pre-simulation state.
