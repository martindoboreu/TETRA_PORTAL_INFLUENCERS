// Tetra Society — the institutional, invitation-based partner status system.
// Replaces the old follower-driven influence levels (lib/influence.ts).
//
// Canonical tier rows (name + commission rate) live in the DB (society_tiers,
// admin-editable). The ordering, copy and the benefits matrix below are product
// constants — the language is deliberately restrained: status, not gamification.

import type { SocietyTierKey } from '@/lib/database.types'

export interface SocietyTierConfig {
  key: SocietyTierKey
  /** Full institutional name, e.g. "Tetra Signature". */
  name: string
  /** Short form for compact marks, e.g. "Signature". */
  short: string
  rank: number
  inviteOnly: boolean
  /** One-line positioning used on the status card. */
  blurb: string
  /** Aspirational line shown on the overview status strip. */
  standing: string
  /** Default commission rate (DB is source of truth; this is a fallback). */
  defaultRate: number
}

export const SOCIETY_TIERS: SocietyTierConfig[] = [
  {
    key: 'select',
    name: 'Tetra Select',
    short: 'Select',
    rank: 1,
    inviteOnly: false,
    blurb: 'Parceiro aprovado para representar a Tetra.',
    standing: 'Você foi aprovado para representar a Tetra.',
    defaultRate: 0.3,
  },
  {
    key: 'signature',
    name: 'Tetra Signature',
    short: 'Signature',
    rank: 2,
    inviteOnly: false,
    blurb: 'Parceiro validado, com acesso prioritário a campanhas.',
    standing: 'Seu histórico já liberou acesso a campanhas prioritárias.',
    defaultRate: 0.32,
  },
  {
    key: 'circle',
    name: 'Tetra Circle',
    short: 'Circle',
    rank: 3,
    inviteOnly: false,
    blurb: 'Parceiro estratégico do círculo interno da Tetra.',
    standing: 'Você faz parte do círculo estratégico da Tetra.',
    defaultRate: 0.35,
  },
  {
    key: 'council',
    name: 'Tetra Council',
    short: 'Council',
    rank: 4,
    inviteOnly: true,
    blurb: 'Nível de conselho, reservado a parceiros convidados pela equipe Tetra.',
    standing: 'Você integra o conselho de parceiros da Tetra.',
    defaultRate: 0.38,
  },
]

export interface SocietyBenefit {
  id: string
  label: string
  /** Minimum tier that unlocks the benefit. */
  minTier: SocietyTierKey
}

// The full benefits matrix, ordered by the tier that unlocks each one.
export const SOCIETY_BENEFITS: SocietyBenefit[] = [
  { id: 'base-commission', label: 'Comissão base', minTier: 'select' },
  { id: 'personal-link', label: 'Link pessoal e cupom', minTier: 'select' },
  { id: 'content-library', label: 'Biblioteca de conteúdo', minTier: 'select' },
  { id: 'base-campaigns', label: 'Campanhas base', minTier: 'select' },

  { id: 'higher-commission', label: 'Comissão ampliada', minTier: 'signature' },
  { id: 'early-access', label: 'Acesso antecipado a campanhas', minTier: 'signature' },
  { id: 'private-campaigns', label: 'Campanhas privadas', minTier: 'signature' },
  { id: 'advanced-briefs', label: 'Briefings avançados', minTier: 'signature' },
  { id: 'monthly-briefings', label: 'Briefings mensais', minTier: 'signature' },

  { id: 'custom-landing', label: 'Landing pages personalizadas', minTier: 'circle' },
  { id: 'premium-drops', label: 'Drops premium de campanhas', minTier: 'circle' },
  { id: 'priority-support', label: 'Suporte prioritário', minTier: 'circle' },
  { id: 'welcome-kit', label: 'Kit físico de boas-vindas', minTier: 'circle' },
  { id: 'private-calls', label: 'Calls privadas', minTier: 'circle' },
  { id: 'advanced-analytics', label: 'Analytics avançado', minTier: 'circle' },

  { id: 'cocreated-campaigns', label: 'Campanhas co-criadas', minTier: 'council' },
  { id: 'special-contracts', label: 'Contratos especiais', minTier: 'council' },
  { id: 'direction-access', label: 'Acesso à direção', minTier: 'council' },
  { id: 'exclusive-events', label: 'Eventos exclusivos', minTier: 'council' },
  { id: 'strategic-opportunities', label: 'Oportunidades estratégicas privadas', minTier: 'council' },
]

// The six criteria the team weighs before extending an invitation.
export type CriterionKind = 'computed' | 'scored'

export interface SocietyCriterion {
  id: string
  label: string
  description: string
  kind: CriterionKind
}

export const SOCIETY_CRITERIA: SocietyCriterion[] = [
  { id: 'attributed_revenue', label: 'Receita atribuída', description: 'Comissão validada gerada no histórico.', kind: 'computed' },
  { id: 'approved_content', label: 'Conteúdos aprovados', description: 'Peças publicadas e validadas pela equipe.', kind: 'scored' },
  { id: 'compliance', label: 'Conformidade com a marca', description: 'Aderência às diretrizes da Tetra.', kind: 'scored' },
  { id: 'campaign_participation', label: 'Participação em campanhas', description: 'Campanhas aceitas e entregues.', kind: 'computed' },
  { id: 'content_quality', label: 'Qualidade de conteúdo', description: 'Avaliação editorial das entregas.', kind: 'scored' },
  { id: 'responsiveness', label: 'Responsividade', description: 'Agilidade na comunicação com o time.', kind: 'scored' },
]

const TIER_BY_KEY = new Map<SocietyTierKey, SocietyTierConfig>(
  SOCIETY_TIERS.map((t) => [t.key, t])
)

export function tierConfig(key: SocietyTierKey): SocietyTierConfig {
  return TIER_BY_KEY.get(key) ?? SOCIETY_TIERS[0]
}

export function tierRank(key: SocietyTierKey): number {
  return tierConfig(key).rank
}

export function isUnlocked(benefit: SocietyBenefit, tier: SocietyTierKey): boolean {
  return tierRank(tier) >= tierRank(benefit.minTier)
}

// The next tier a partner could be invited to. Council is invite-only and is
// never surfaced as a "next" target with criteria.
export function nextTier(key: SocietyTierKey): SocietyTierConfig | null {
  const current = tierConfig(key)
  const candidate = SOCIETY_TIERS.find((t) => t.rank === current.rank + 1)
  if (!candidate) return null
  return candidate
}

export function isSocietyTierKey(value: string | null | undefined): value is SocietyTierKey {
  return value === 'select' || value === 'signature' || value === 'circle' || value === 'council'
}

export function normalizeTierKey(value: string | null | undefined): SocietyTierKey {
  return isSocietyTierKey(value) ? value : 'select'
}

// First benefit unlocked exclusively by the next tier — used for "locked teaser" copy.
export function firstLockedBenefit(tier: SocietyTierKey): SocietyBenefit | null {
  return SOCIETY_BENEFITS.find((b) => !isUnlocked(b, tier)) ?? null
}
