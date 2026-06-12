// sim:cleanup — remove every trace of the simulation.
//
// Deletes the QA influencers' events and links, then the auth users themselves
// (which cascades their profiles). Scoped strictly to the partner_ids in the
// manifest, so real partner data is never touched.
//
//   npm run sim:cleanup                 # full teardown (events + links + users)
//   npm run sim:cleanup -- --events-only # wipe traffic, keep the QA influencers

import { admin, readManifest, MANIFEST_PATH } from './lib.mjs'
import { unlinkSync, existsSync } from 'node:fs'

const eventsOnly = process.argv.includes('--events-only')
const sb = admin()
const manifest = readManifest()
const ids = manifest.influencers.map((i) => i.partner_id)

console.log(`\n▸ cleanup ${eventsOnly ? '(events only)' : '(full teardown)'} — ${ids.length} QA influencers\n`)

async function del(table) {
  const { count, error } = await sb
    .from(table)
    .delete({ count: 'exact' })
    .in('partner_id', ids)
  if (error) throw error
  console.log(`  − ${table}: ${count ?? 0} rows`)
}

// Order matters only for clarity; FKs are ON DELETE CASCADE/SET NULL.
await del('conversions')
await del('leads')
await del('clicks')
await del('payouts')

if (!eventsOnly) {
  await del('links')
  for (const inf of manifest.influencers) {
    const { error } = await sb.auth.admin.deleteUser(inf.partner_id)
    if (error && !/not found/i.test(error.message)) throw error
    console.log(`  − user ${inf.email}`)
  }
  if (existsSync(MANIFEST_PATH)) unlinkSync(MANIFEST_PATH)
  console.log('\n✔ full teardown complete. No simulation data remains.\n')
} else {
  console.log('\n✔ traffic wiped. QA influencers kept — run sim:run again to refill.\n')
}
