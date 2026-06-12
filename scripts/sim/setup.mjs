// sim:setup — idempotently provision the [SIM] QA influencers and their links.
//
// Creates one auth user + profile per influencer (so you can log in and watch
// their dashboard) and the tracking links/coupons traffic will flow through.
// Writes a manifest the other scripts read. Safe to run repeatedly.

import {
  admin, rosterFor, QA_EMAIL, QA_PASSWORD, writeManifest, arg, SCALES, BASE_URL, SUPABASE_URL,
} from './lib.mjs'

const scale = arg('scale', 'realistic')
if (!SCALES[scale]) {
  console.error(`Unknown --scale=${scale}. Use: ${Object.keys(SCALES).join(', ')}`)
  process.exit(1)
}

const sb = admin()
const roster = rosterFor(scale)

console.log(`\n▸ setup (scale=${scale}) → ${SUPABASE_URL}`)
console.log(`  portal base for traffic: ${BASE_URL}\n`)

async function findUserByEmail(email) {
  // Paginate admin user list (small QA set, so a couple pages is plenty).
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email === email)
    if (hit) return hit
    if (data.users.length < 200) return null
  }
  return null
}

const manifest = { scale, createdAt: new Date().toISOString(), influencers: [] }

for (const inf of roster) {
  const email = QA_EMAIL(inf.key)

  // 1) auth user (idempotent)
  let user = await findUserByEmail(email)
  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: QA_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: inf.name },
    })
    if (error) throw error
    user = data.user
    console.log(`  + created user ${email}`)
  } else {
    console.log(`  = user exists ${email}`)
  }

  // 2) profile — active partner, onboarding done, Society tier + rate
  const { error: pErr } = await sb
    .from('profiles')
    .update({
      role: 'partner',
      status: 'ativo',
      full_name: inf.name,
      handle: inf.handle,
      avatar_initials: inf.initials,
      commission_rate: inf.rate,
      society_tier: inf.tier,
      follower_count: inf.followers,
      pix_key: email,
      onboarding_completed: true,
    })
    .eq('id', user.id)
  if (pErr) throw pErr

  // 3) links (idempotent by unique slug)
  const sources = []
  for (const s of inf.sources) {
    const { data: existing } = await sb.from('links').select('id').eq('slug', s.slug).maybeSingle()
    let linkId = existing?.id
    if (!linkId) {
      const { data, error } = await sb
        .from('links')
        .insert({
          partner_id: user.id,
          label: s.label,
          slug: s.slug,
          discount_code: s.coupon,
          status: 'active',
        })
        .select('id')
        .single()
      if (error) throw error
      linkId = data.id
    }
    sources.push({ ...s, link_id: linkId })
  }

  manifest.influencers.push({
    key: inf.key,
    partner_id: user.id,
    email,
    handle: inf.handle,
    name: inf.name,
    tier: inf.tier,
    rate: inf.rate,
    weight: inf.weight,
    sources,
  })

  console.log(`  ✓ ${inf.name} — ${sources.length} sources, ${Math.round(inf.rate * 100)}%`)
}

writeManifest(manifest)

console.log(`\n✔ ${roster.length} QA influencers ready. Manifest written.`)
console.log(`  Log in as any of them with password: ${QA_PASSWORD}`)
console.log(`  Next: npm run sim:run -- --scale=${scale}\n`)
