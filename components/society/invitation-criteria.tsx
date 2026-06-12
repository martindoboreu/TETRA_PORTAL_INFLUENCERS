import { Check, Clock, Lock } from 'lucide-react'
import { SOCIETY_CRITERIA } from '@/lib/society'
import type { SocietyTierConfig } from '@/lib/society'
import type { SocietyCriteriaValues } from '@/lib/queries/society'
import type { SocietyTierKey } from '@/lib/database.types'
import { formatCurrency, formatNumber } from '@/lib/format'

// Quiet validation thresholds per target tier. These describe what the team
// looks for before extending an invitation — never shown as progress-to-prize.
type Thresholds = Record<string, number>

const THRESHOLDS: Partial<Record<SocietyTierKey, Thresholds>> = {
  signature: {
    attributed_revenue: 2000,
    approved_content: 8,
    compliance: 85,
    campaign_participation: 1,
    content_quality: 80,
    responsiveness: 75,
  },
  circle: {
    attributed_revenue: 8000,
    approved_content: 20,
    compliance: 90,
    campaign_participation: 3,
    content_quality: 88,
    responsiveness: 85,
  },
}

function valueFor(id: string, c: SocietyCriteriaValues): number {
  switch (id) {
    case 'attributed_revenue': return c.attributedRevenue
    case 'approved_content': return c.approvedContentCount
    case 'compliance': return c.complianceScore
    case 'campaign_participation': return c.campaignParticipation
    case 'content_quality': return c.contentQualityScore
    case 'responsiveness': return c.responsivenessScore
    default: return 0
  }
}

function displayValue(id: string, value: number): string {
  if (id === 'attributed_revenue') return formatCurrency(value)
  if (id === 'compliance' || id === 'content_quality' || id === 'responsiveness') return `${value}/100`
  return formatNumber(value)
}

interface InvitationCriteriaProps {
  nextTier: SocietyTierConfig
  criteria: SocietyCriteriaValues
}

export function InvitationCriteria({ nextTier, criteria }: InvitationCriteriaProps) {
  const thresholds = THRESHOLDS[nextTier.key] ?? {}

  return (
    <section className="tetra-card p-6">
      <h2 className="text-base font-semibold text-ink">
        Critérios para convite ao {nextTier.name}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        O histórico abaixo é avaliado pela equipe Tetra. Não há metas a bater — o convite é estendido após a validação do conjunto.
      </p>

      <ul className="mt-5 divide-y divide-line">
        {SOCIETY_CRITERIA.map((criterion) => {
          const value = valueFor(criterion.id, criteria)
          const target = thresholds[criterion.id]
          const met = target !== undefined ? value >= target : false

          return (
            <li key={criterion.id} className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{criterion.label}</p>
                <p className="text-xs text-ink-subtle">{criterion.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm tabular-nums text-ink-muted">{displayValue(criterion.id, value)}</span>
                {met ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink">
                    <Check className="h-3 w-3" /> Validado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
                    <Clock className="h-3 w-3" /> Em avaliação
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-5 flex items-center gap-2 text-xs text-ink-subtle">
        <Lock className="h-3.5 w-3.5" />
        Convites são estendidos pela equipe Tetra após a validação do histórico.
      </p>
    </section>
  )
}

export function CouncilCard() {
  return (
    <section className="tetra-card border-ink/15 bg-surface-muted/60 p-6">
      <h2 className="text-base font-semibold text-ink">Tetra Council</h2>
      <p className="mt-2 max-w-xl text-sm text-ink-muted">
        O Tetra Council é reservado para parceiros convidados diretamente pela equipe Tetra.
        Acesso por convite — sem critérios públicos e sem progressão automática.
      </p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink">
        <Lock className="h-3.5 w-3.5" /> Acesso por convite
      </p>
    </section>
  )
}
