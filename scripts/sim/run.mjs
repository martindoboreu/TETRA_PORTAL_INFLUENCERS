// sim:run — generate realistic traffic through the live ingestion endpoints.
//
// Per influencer we simulate visitors:  click /r/{slug}  →  (leadRate) lead  →
// (convRate of leads) conversion. Woven in: refunds (follow-up POST, same
// order_id), coupon-only attribution (no ref), bogus-coupon noise (exercises
// the attributed:false path) and duplicate POSTs (exercises idempotency).
//
// Nothing here writes to the DB directly — it all goes over HTTP, exactly like
// the brand site would. Requests run through a bounded-concurrency pool.

import {
  BASE_URL, INGEST_KEY, SCALES, FUNNEL, readManifest, arg, pool, chance, pick, rint,
  randomBuyer, randomCourse, fmtBRL,
} from './lib.mjs'

const scale = arg('scale', 'realistic')
const preset = SCALES[scale]
if (!preset) {
  console.error(`Unknown --scale=${scale}. Use: ${Object.keys(SCALES).join(', ')}`)
  process.exit(1)
}
if (!INGEST_KEY) {
  console.error('TETRA_INGEST_KEY is not set in .env.local — ingestion will 401.')
  process.exit(1)
}

const manifest = readManifest()
const runId = Date.now().toString(36)

const HDRS = { 'content-type': 'application/json', 'x-tetra-ingest-key': INGEST_KEY }
const UTM = ['utm_source=ig&utm_medium=bio', 'utm_source=yt&utm_medium=desc', 'utm_source=wpp', '']

const stats = {
  clicks: 0, clickFail: 0,
  leads: 0, leadUnattributed: 0,
  conversions: 0, convUnattributed: 0, refunds: 0, replays: 0,
  expectedCommission: 0,
}

async function clickThrough(slug) {
  const qs = pick(UTM)
  const url = `${BASE_URL}/r/${slug}${qs ? `?${qs}` : ''}`
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual' })
    // 302/307 = recorded + redirecting; 200 only if a slug page existed (it won't).
    if (res.status >= 300 && res.status < 400) stats.clicks++
    else stats.clickFail++
  } catch {
    stats.clickFail++
  }
}

async function postLead(body) {
  const res = await fetch(`${BASE_URL}/api/track/lead`, {
    method: 'POST', headers: HDRS, body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (json.attributed) stats.leads++
  else stats.leadUnattributed++
}

async function postConversion(body) {
  const res = await fetch(`${BASE_URL}/api/track/conversion`, {
    method: 'POST', headers: HDRS, body: JSON.stringify(body),
  })
  return res.json().catch(() => ({}))
}

// Build the full list of visitor "jobs" up front, then run them concurrently.
const jobs = []
for (const inf of manifest.influencers) {
  const visitors = Math.max(1, Math.round(preset.visitors * inf.weight))
  for (let v = 0; v < visitors; v++) {
    jobs.push({ inf, v })
  }
}
// Shuffle so traffic interleaves across influencers (more realistic load).
for (let i = jobs.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[jobs[i], jobs[j]] = [jobs[j], jobs[i]]
}

console.log(`\n▸ run (scale=${scale}) runId=${runId}`)
console.log(`  ${manifest.influencers.length} influencers · ${jobs.length} visitors · concurrency ${preset.concurrency}`)
console.log(`  target: ${BASE_URL}\n`)

let done = 0
const tick = Math.max(1, Math.floor(jobs.length / 20))

await pool(jobs, preset.concurrency, async ({ inf }, idx) => {
  const src = pick(inf.sources)

  // 1) the click (always)
  await clickThrough(src.slug)

  // 2) lead?
  if (chance(FUNNEL.leadRate)) {
    await postLead({
      ref: src.slug,
      buyer: randomBuyer(),
      external_id: `sim:${runId}:lead:${idx}`,
    })

    // 3) conversion? (only leads convert)
    if (chance(FUNNEL.convRate)) {
      const { course, amount } = randomCourse()
      const orderId = `sim:${runId}:ord:${idx}`

      // Attribution: usually the ref cookie; sometimes coupon-only; rarely bogus.
      let attr
      if (chance(FUNNEL.unattributedShare)) attr = { coupon: 'SIM_BOGUS_NO_MATCH' }
      else if (chance(FUNNEL.couponOnlyShare)) attr = { coupon: src.coupon }
      else attr = { ref: src.slug }

      const body = { order_id: orderId, course, amount, buyer: randomBuyer(), ...attr }
      const res = await postConversion(body)

      if (res.attributed) {
        stats.conversions++
        stats.expectedCommission += amount * inf.rate
      } else {
        stats.convUnattributed++
      }

      // 3a) idempotency: occasionally resend the same order — must NOT duplicate.
      if (res.attributed && chance(FUNNEL.replayShare)) {
        await postConversion(body)
        stats.replays++
      }

      // 3b) refund: follow-up event on the same order_id flips status.
      if (res.attributed && chance(FUNNEL.refundRate)) {
        await postConversion({ ...body, status: 'reembolsado' })
        stats.refunds++
      }
    }
  }

  if (++done % tick === 0) {
    process.stdout.write(`\r  progress ${Math.round((done / jobs.length) * 100)}%   `)
  }
})

process.stdout.write('\r')
console.log('  progress 100%        \n')
console.log('  ── sent ─────────────────────────────')
console.log(`  clicks recorded     ${stats.clicks}  (failed ${stats.clickFail})`)
console.log(`  leads attributed    ${stats.leads}  (unattributed ${stats.leadUnattributed})`)
console.log(`  conversions         ${stats.conversions}  (bogus-coupon ${stats.convUnattributed})`)
console.log(`  refunds sent        ${stats.refunds}`)
console.log(`  idempotency replays ${stats.replays}  (should not add rows)`)
console.log(`  expected commission ${fmtBRL(stats.expectedCommission)}  (pre-refund)`)
console.log(`\n✔ traffic complete. Next: npm run sim:verify\n`)
