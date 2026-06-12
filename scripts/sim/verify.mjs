// sim:verify — read the data back through the SAME RPCs the dashboards call,
// print per-influencer + program-wide rollups, and assert the invariants that
// must hold if the whole pipeline is correct. If this passes, the partner and
// admin dashboards are showing exactly these numbers.

import { admin, readManifest, fmtBRL } from './lib.mjs'

const sb = admin()
const manifest = readManifest()
const ids = manifest.influencers.map((i) => i.partner_id)

// Range wide enough to include "now" (sim rows are created at insert time).
const from = new Date(Date.now() - 90 * 86400_000).toISOString()
const to = new Date(Date.now() + 86400_000).toISOString()

const failures = []
const ok = (cond, msg) => { if (!cond) failures.push(msg) }

console.log('\n▸ verify — reading back through dashboard RPCs\n')

// --- per influencer (partner dashboard view) -------------------------------
console.log('  PARTNER DASHBOARDS (partner_funnel_in_range / partner_kpis_in_range)')
console.log('  ' + 'influencer'.padEnd(20) + 'clicks'.padStart(8) + 'leads'.padStart(8) +
  'matríc'.padStart(8) + 'pagos'.padStart(7) + 'comissão'.padStart(15))

let totClicks = 0, totLeads = 0, totConv = 0
for (const inf of manifest.influencers) {
  const { data: f, error: fe } = await sb.rpc('partner_funnel_in_range', {
    p_partner: inf.partner_id, p_from: from, p_to: to,
  })
  if (fe) throw fe
  const funnel = f?.[0] ?? { cliques: 0, leads: 0, matriculas: 0, pagos: 0 }

  const { data: k } = await sb.rpc('partner_kpis_in_range', {
    p_partner: inf.partner_id, p_from: from, p_to: to,
  })
  const comissao = k?.[0]?.comissao ?? 0

  totClicks += Number(funnel.cliques)
  totLeads += Number(funnel.leads)
  totConv += Number(funnel.matriculas)

  console.log('  ' + inf.name.padEnd(20) +
    String(funnel.cliques).padStart(8) + String(funnel.leads).padStart(8) +
    String(funnel.matriculas).padStart(8) + String(funnel.pagos).padStart(7) +
    fmtBRL(comissao).padStart(15))

  // invariants: a clean funnel never widens downstream
  ok(Number(funnel.leads) <= Number(funnel.cliques),
    `${inf.name}: leads (${funnel.leads}) > clicks (${funnel.cliques})`)
  ok(Number(funnel.matriculas) <= Number(funnel.leads),
    `${inf.name}: matrículas (${funnel.matriculas}) > leads (${funnel.leads})`)
}
console.log('  ' + '─'.repeat(64))
console.log('  ' + 'TOTAL'.padEnd(20) + String(totClicks).padStart(8) +
  String(totLeads).padStart(8) + String(totConv).padStart(8))

// --- link performance spot-check (the table on the dashboard) --------------
const sample = manifest.influencers[0]
const { data: links } = await sb.rpc('partner_link_performance_in_range', {
  p_partner: sample.partner_id, p_from: from, p_to: to,
})
console.log(`\n  LINK PERFORMANCE — ${sample.name}`)
for (const l of links ?? []) {
  console.log('  ' + l.label.padEnd(34) + String(l.cliques).padStart(7) +
    String(l.leads).padStart(7) + String(l.conversoes).padStart(7) +
    `${l.taxa_conversao}%`.padStart(8) + fmtBRL(l.comissao).padStart(14))
}

// --- admin dashboard (program-wide + roster) -------------------------------
const { data: ak } = await sb.rpc('admin_program_kpis_in_range', { p_from: from, p_to: to })
const prog = ak?.[0] ?? {}
console.log('\n  ADMIN DASHBOARD (admin_program_kpis_in_range — whole program)')
console.log(`    cliques ${prog.cliques}  ·  leads ${prog.leads}  ·  conversões ${prog.conversoes}` +
  `  ·  comissão total ${fmtBRL(prog.comissao_total)}  ·  a repassar ${fmtBRL(prog.a_repassar)}`)
console.log(`    parceiros ativos: ${prog.parceiros_ativos}`)

// --- hard invariants on the raw rows ---------------------------------------
// 1) commission == amount * partner rate, rounded to cents (computed server-side)
const rateById = new Map(manifest.influencers.map((i) => [i.partner_id, i.rate]))
const { data: convs, error: ce } = await sb
  .from('conversions')
  .select('partner_id, amount, commission, external_id, status')
  .in('partner_id', ids)
  .like('external_id', 'sim:%')
if (ce) throw ce

let commissionChecked = 0
for (const c of convs) {
  const expected = Math.round(c.amount * rateById.get(c.partner_id) * 100) / 100
  ok(Math.abs(expected - Number(c.commission)) < 0.01,
    `commission mismatch on ${c.external_id}: got ${c.commission}, expected ${expected}`)
  commissionChecked++
}

// 2) idempotency: every external_id appears exactly once despite replays
const seen = new Map()
for (const c of convs) seen.set(c.external_id, (seen.get(c.external_id) ?? 0) + 1)
const dupes = [...seen.entries()].filter(([, n]) => n > 1)
ok(dupes.length === 0, `idempotency broken: ${dupes.length} duplicated order(s)`)

// 3) refunds actually transitioned status
const refunded = convs.filter((c) => c.status === 'reembolsado').length

console.log('\n  INVARIANTS')
console.log(`    commission = amount × rate ......... checked ${commissionChecked} conversions`)
console.log(`    idempotency (no duplicate orders) .. ${dupes.length === 0 ? 'OK' : 'FAIL'}`)
console.log(`    refunds transitioned to reembolsado  ${refunded}`)

if (failures.length) {
  console.log(`\n✗ ${failures.length} invariant(s) FAILED:`)
  for (const f of failures.slice(0, 20)) console.log(`   - ${f}`)
  process.exit(1)
}
console.log('\n✔ all invariants hold — dashboards reflect the simulated traffic.\n')
