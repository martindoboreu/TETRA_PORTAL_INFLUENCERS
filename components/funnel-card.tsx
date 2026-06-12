import { Filter } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { formatNumber, formatPercentage } from '@/lib/format'

interface FunnelCardProps {
  data: {
    cliques: number
    leads: number
    matriculas: number
    pagos: number
  }
  /** e.g. "05 de jul." — used in the settlement note on the last stage. */
  nextPayoutLabel?: string
}

interface Stage {
  key: string
  label: string
  definition: string
  value: number
  /** Bar fill — monochrome scale, teal on the money stage. */
  bar: string
}

export function FunnelCard({ data, nextPayoutLabel }: FunnelCardProps) {
  const stages: Stage[] = [
    {
      key: 'cliques',
      label: 'Cliques',
      definition: 'Visitas únicas vindas dos seus links.',
      value: data.cliques,
      bar: 'bg-[#1d1d1b]/25',
    },
    {
      key: 'leads',
      label: 'Leads',
      definition: 'Pessoas que deixaram contato em uma página Tetra.',
      value: data.leads,
      bar: 'bg-[#1d1d1b]/45',
    },
    {
      key: 'matriculas',
      label: 'Matrículas',
      definition: 'Conversões confirmadas ou pagas no período.',
      value: data.matriculas,
      bar: 'bg-[#1d1d1b]/70',
    },
    {
      key: 'pagos',
      label: 'Pagamentos confirmados',
      definition: 'Matrículas com pagamento liquidado — base da sua comissão.',
      value: data.pagos,
      bar: 'bg-[#0FB5A6]',
    },
  ]

  const max = stages[0].value
  const hasTraffic = max > 0

  // Step conversion between consecutive stages, and the biggest relative loss.
  const steps = stages.slice(1).map((stage, i) => {
    const prev = stages[i]
    const rate = prev.value > 0 ? (stage.value / prev.value) * 100 : null
    return { from: prev, to: stage, rate }
  })
  // A zero on the payments stage is settlement timing, not funnel loss —
  // never flag it as the biggest drop-off.
  const biggestLoss = steps
    .filter((s) => s.rate !== null && s.from.value > 0)
    .filter((s) => !(s.to.key === 'pagos' && s.to.value === 0))
    .reduce<(typeof steps)[number] | null>(
      (worst, s) => (worst === null || (s.rate ?? 100) < (worst.rate ?? 100) ? s : worst),
      null
    )

  const overallRate = max > 0 ? (data.matriculas / max) * 100 : 0

  return (
    <div className="animate-fade-slide-up flex flex-col rounded-2xl border border-line bg-white p-6 shadow-[var(--elevation-card)]">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">Funil de conversão</h3>
        {hasTraffic && (
          <span className="text-xs tabular-nums text-ink-muted">
            Conv. geral {formatPercentage(overallRate)}
          </span>
        )}
      </div>

      {!hasTraffic ? (
        <EmptyState
          compact
          icon={Filter}
          title="Sem tráfego no período"
          description="Divulgue seus links para acompanhar cliques, leads e matrículas aqui."
        />
      ) : (
        <div className="mt-5 flex flex-1 flex-col justify-between gap-1">
          {stages.map((stage, index) => {
            const pct = max > 0 ? (stage.value / max) * 100 : 0
            const step = index > 0 ? steps[index - 1] : null
            const isWorst =
              step !== null &&
              biggestLoss !== null &&
              step.to.key === biggestLoss.to.key &&
              steps.filter((s) => s.rate !== null).length > 1
            const isZeroPayments = stage.key === 'pagos' && stage.value === 0

            return (
              <div key={stage.key}>
                {/* Step connector: how much advanced from the previous stage. */}
                {step && (
                  <p
                    className={
                      'py-1.5 pl-[3px] text-[11px] leading-none tabular-nums ' +
                      (isWorst ? 'font-medium text-[#B45309]' : 'text-ink-subtle')
                    }
                  >
                    {isZeroPayments && data.matriculas > 0
                      ? '↳ aguardando liquidação'
                      : `↳ ${step.rate === null ? '—' : formatPercentage(step.rate)} avançam${isWorst ? ' · maior perda do funil' : ''}`}
                  </p>
                )}

                <div className="flex items-baseline justify-between gap-3" title={stage.definition}>
                  <span className="text-micro">{stage.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatNumber(stage.value)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  {stage.value > 0 && (
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${stage.bar}`}
                      style={{ width: `${pct}%`, minWidth: '6px' }}
                    />
                  )}
                </div>

                {isZeroPayments && data.matriculas > 0 && (
                  <p className="mt-1.5 text-[11px] leading-snug text-ink-subtle">
                    Pagamentos consolidam no repasse mensal
                    {nextPayoutLabel ? ` · próximo em ${nextPayoutLabel}` : ''}.
                  </p>
                )}
              </div>
            )
          })}

          {biggestLoss && biggestLoss.rate !== null && (
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Sua maior perda está entre{' '}
              <span className="font-medium text-ink">{biggestLoss.from.label.toLowerCase()}</span> e{' '}
              <span className="font-medium text-ink">{biggestLoss.to.label.toLowerCase()}</span> —{' '}
              {formatPercentage(100 - biggestLoss.rate)} não avançam nessa etapa.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
