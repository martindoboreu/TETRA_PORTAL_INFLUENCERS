import { Check, Clock, Lock, Minus } from 'lucide-react'
import { SOCIETY_CRITERIA } from '@/lib/society'
import type { SocietyTierConfig } from '@/lib/society'
import type { SocietyCriteriaValues } from '@/lib/queries/society'
import type { SocietyTierKey } from '@/lib/database.types'
import { formatCurrencyCompact, formatCurrency, formatNumber } from '@/lib/format'

// Quiet validation references per target tier. These describe what the team
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

type CriterionState = 'validado' | 'avaliacao' | 'pendente'

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

function displayReference(id: string, target: number): string {
  if (id === 'attributed_revenue') return `≥ ${formatCurrencyCompact(target)}`
  if (id === 'compliance' || id === 'content_quality' || id === 'responsiveness') return `≥ ${target}/100`
  return `≥ ${formatNumber(target)}`
}

function stateFor(value: number, target: number | undefined): CriterionState {
  if (target !== undefined && value >= target) return 'validado'
  if (value > 0) return 'avaliacao'
  return 'pendente'
}

const STATE_META: Record<CriterionState, { label: string; pill: string; icon: typeof Check }> = {
  validado: {
    label: 'Validado',
    pill: 'border-[#0FB5A6]/30 bg-[#0FB5A6]/10 text-[#0E7C73]',
    icon: Check,
  },
  avaliacao: {
    label: 'Em avaliação',
    pill: 'border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#B45309]',
    icon: Clock,
  },
  pendente: {
    label: 'Pendente',
    pill: 'border-line bg-surface-muted text-ink-muted',
    icon: Minus,
  },
}

interface InvitationCriteriaProps {
  nextTier: SocietyTierConfig
  criteria: SocietyCriteriaValues
}

export function InvitationCriteria({ nextTier, criteria }: InvitationCriteriaProps) {
  const thresholds = THRESHOLDS[nextTier.key] ?? {}

  const rows = SOCIETY_CRITERIA.map((criterion) => {
    const value = valueFor(criterion.id, criteria)
    const target = thresholds[criterion.id]
    return { criterion, value, target, state: stateFor(value, target) }
  })

  const validated = rows.filter((r) => r.state === 'validado').length

  return (
    <section className="tetra-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">
          Critérios avaliados para convite ao {nextTier.name}
        </h2>
        <span className="text-sm tabular-nums text-ink-muted">
          {validated} de {rows.length} validados
        </span>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">
        O histórico abaixo é avaliado pela equipe Tetra. As referências indicam o que o time
        observa — não são metas a bater.
      </p>

      <ul className="mt-5 divide-y divide-line">
        {rows.map(({ criterion, value, target, state }) => {
          const meta = STATE_META[state]
          const Icon = meta.icon
          return (
            <li
              key={criterion.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_8.5rem]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{criterion.label}</p>
                <p className="mt-0.5 text-xs text-ink-subtle">{criterion.description}</p>
              </div>
              <span className="text-right text-sm font-medium tabular-nums text-ink">
                {displayValue(criterion.id, value)}
              </span>
              <span className="hidden text-right text-xs tabular-nums text-ink-subtle sm:block">
                {target !== undefined ? `Referência: ${displayReference(criterion.id, target)}` : '—'}
              </span>
              <span className="hidden justify-self-end sm:block">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.pill}`}
                >
                  <Icon className="h-3 w-3" /> {meta.label}
                </span>
              </span>
              {/* Mobile: state pill drops under the name. */}
              <span className="col-span-2 sm:hidden">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.pill}`}
                >
                  <Icon className="h-3 w-3" /> {meta.label}
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-subtle">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        O convite é concedido após avaliação do conjunto. Não há progressão automática.
      </p>
    </section>
  )
}
