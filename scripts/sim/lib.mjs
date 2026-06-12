// Shared config + helpers for the traffic simulation harness.
//
// The simulation drives the REAL ingestion endpoints (/r/[slug],
// /api/track/lead, /api/track/conversion) at volume, so the data that reaches
// the partner and admin dashboards travels the exact same code path production
// traffic would. Everything is isolated under clearly-tagged [SIM] QA
// influencers so cleanup is exact and never touches real partners.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
export const MANIFEST_PATH = join(HERE, '.manifest.json')

// --- env -------------------------------------------------------------------
// Minimal .env.local parser so the scripts run on any Node version without a
// dotenv dependency. process.env always wins over the file.
function loadEnv() {
  const path = join(ROOT, '.env.local')
  const out = {}
  if (existsSync(path)) {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return { ...out, ...process.env }
}

export const env = loadEnv()

export const BASE_URL = (env.SIM_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
export const INGEST_KEY = env.TETRA_INGEST_KEY ?? ''
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
export const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY
export const QA_PASSWORD = env.SIM_PARTNER_PASSWORD ?? 'SimDemo1234!'

export function admin() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// --- scale presets ---------------------------------------------------------
// `visitors` is the per-top-influencer baseline; each influencer scales it by
// its own weight, so volume is realistically uneven across the roster.
export const SCALES = {
  micro: { influencers: 1, visitors: 30, concurrency: 8 },
  small: { influencers: 3, visitors: 250, concurrency: 24 },
  realistic: { influencers: 5, visitors: 1600, concurrency: 40 },
  heavy: { influencers: 5, visitors: 6000, concurrency: 60 },
}

// --- QA influencer roster --------------------------------------------------
// Deterministic ids so setup/cleanup are idempotent. Clearly tagged [SIM].
// `weight` skews traffic; `tier` drives the commission rate via the Society
// trigger (and we set the rate explicitly too, defensively).
export const ROSTER = [
  {
    key: 'marina', name: '[SIM] Marina Teste', handle: 'sim.marina', initials: 'MS',
    tier: 'signature', rate: 0.32, followers: 22200, weight: 1.4,
    sources: [
      { key: 'reel', label: 'Reel "IA não é Google"', slug: 'sim-marina-reel', coupon: 'SIMMARREEL' },
      { key: 'bio', label: 'Bio Instagram (@sim.marina)', slug: 'sim-marina-bio', coupon: 'SIMMARBIO' },
      { key: 'yt', label: 'Descrição YouTube', slug: 'sim-marina-yt', coupon: 'SIMMARYT' },
      { key: 'story', label: 'Story sequência IA', slug: 'sim-marina-story', coupon: 'SIMMARSTORY' },
    ],
  },
  {
    key: 'bruno', name: '[SIM] Bruno Teste', handle: 'sim.bruno', initials: 'BT',
    tier: 'circle', rate: 0.35, followers: 1300000, weight: 1.0,
    sources: [
      { key: 'news', label: 'Newsletter LinkedIn', slug: 'sim-bruno-news', coupon: 'SIMBRUNEWS' },
      { key: 'tiktok', label: 'Bio TikTok', slug: 'sim-bruno-tiktok', coupon: 'SIMBRUTT' },
      { key: 'podcast', label: 'Podcast Dados ao Vivo', slug: 'sim-bruno-pod', coupon: 'SIMBRUPOD' },
      { key: 'wpp', label: 'WhatsApp lista quente', slug: 'sim-bruno-wpp', coupon: 'SIMBRUWPP' },
    ],
  },
  {
    key: 'camila', name: '[SIM] Camila Teste', handle: 'sim.camila', initials: 'CT',
    tier: 'select', rate: 0.30, followers: 6500, weight: 0.7,
    sources: [
      { key: 'blog', label: 'Blog próprio', slug: 'sim-camila-blog', coupon: 'SIMCAMBLOG' },
      { key: 'comunidade', label: 'Comunidade Excel BR', slug: 'sim-camila-com', coupon: 'SIMCAMCOM' },
      { key: 'lp', label: 'Landing page personalizada', slug: 'sim-camila-lp', coupon: 'SIMCAMLP' },
    ],
  },
  {
    key: 'daniel', name: '[SIM] Daniel Teste', handle: 'sim.daniel', initials: 'DT',
    tier: 'select', rate: 0.30, followers: 22000, weight: 0.5,
    sources: [
      { key: 'email', label: 'Assinatura de e-mail', slug: 'sim-daniel-email', coupon: 'SIMDANMAIL' },
      { key: 'wpp', label: 'Grupo WhatsApp BI', slug: 'sim-daniel-wpp', coupon: 'SIMDANWPP' },
    ],
  },
  {
    key: 'fabio', name: '[SIM] Fábio Teste', handle: 'sim.fabio', initials: 'FT',
    tier: 'select', rate: 0.30, followers: 3200, weight: 0.4,
    sources: [
      { key: 'bio', label: 'Bio Instagram (@sim.fabio)', slug: 'sim-fabio-bio', coupon: 'SIMFABBIO' },
      { key: 'reel', label: 'Reel curso de Excel', slug: 'sim-fabio-reel', coupon: 'SIMFABREEL' },
    ],
  },
]

export function rosterFor(scale) {
  return ROSTER.slice(0, SCALES[scale].influencers)
}

export const QA_EMAIL = (key) => `sim+${key}@tetra.test`

// --- course catalog (matches the product seed) -----------------------------
export const COURSES = [
  { name: 'Curso completo de IA', min: 800, max: 1200 },
  { name: 'Excel Avançado', min: 300, max: 500 },
  { name: 'Power BI', min: 400, max: 700 },
  { name: 'Inglês Corporativo', min: 500, max: 900 },
  { name: 'MBA BI & Analytics', min: 1400, max: 1800 },
  { name: 'Pós Gestão e IA', min: 1000, max: 1500 },
]

const BUYERS = [
  'Lucas Pereira', 'Rafael Santos', 'Julia Oliveira', 'Ana Costa', 'Caio Prado',
  'Marina Sousa', 'Tiago Gomes', 'Paula Ribeiro', 'Nina Cardoso', 'Vitor Araújo',
  'Igor Mendes', 'Fernanda Barbosa', 'Gustavo Nascimento', 'Bruna Carvalho',
]

// --- funnel behaviour ------------------------------------------------------
export const FUNNEL = {
  leadRate: 0.14, // share of clicks that become leads
  convRate: 0.12, // share of LEADS that convert
  refundRate: 0.04, // share of conversions later refunded
  couponOnlyShare: 0.25, // conversions attributed by coupon, no ref cookie
  unattributedShare: 0.03, // bogus coupon → exercises attributed:false path
  replayShare: 0.02, // duplicate POSTs → exercises idempotency
}

// --- random helpers --------------------------------------------------------
export const rint = (min, max) => Math.floor(min + Math.random() * (max - min + 1))
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
export const chance = (p) => Math.random() < p

export function randomBuyer() {
  if (chance(0.6)) {
    const name = pick(BUYERS)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '.')
    return `${name}@example.com`
  }
  if (chance(0.5)) return `+55 11 9${rint(1000, 9999)}-${rint(1000, 9999)}`
  return pick(BUYERS)
}

export function randomCourse() {
  const c = pick(COURSES)
  const amount = Math.round((c.min + Math.random() * (c.max - c.min)) * 100) / 100
  return { course: c.name, amount }
}

// Simple bounded-concurrency worker pool.
export async function pool(items, concurrency, worker) {
  let i = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      await worker(items[idx], idx)
    }
  })
  await Promise.all(runners)
}

// --- manifest --------------------------------------------------------------
export function writeManifest(data) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2))
}
export function readManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error('No manifest found. Run `npm run sim:setup` first.')
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
}

export function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}

export const fmtBRL = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
