import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SocietyMark } from '@/components/society/society-mark'
import { SOCIETY_BENEFITS, SOCIETY_TIERS, tierRank } from '@/lib/society'
import type { SocietyTierKey } from '@/lib/database.types'

interface BenefitsMatrixProps {
  currentTier: SocietyTierKey
  /** Tier rows from the DB to source the live commission rate per column. */
  tiers: { key: string; commission_rate: number }[]
}

export function BenefitsMatrix({ currentTier, tiers }: BenefitsMatrixProps) {
  const currentRank = tierRank(currentTier)
  const rateByKey = new Map(tiers.map((t) => [t.key, t.commission_rate]))

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-ink">Benefícios liberados e bloqueados</h2>
        <p className="hidden text-sm text-ink-muted sm:block">Cada status acumula os benefícios dos anteriores</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {SOCIETY_TIERS.map((tier) => {
          const isCurrent = tier.key === currentTier
          const unlocked = currentRank >= tier.rank
          const benefits = SOCIETY_BENEFITS.filter((b) => b.minTier === tier.key)
          const rate = rateByKey.get(tier.key) ?? tier.defaultRate

          return (
            <div
              key={tier.key}
              className={cn(
                'rounded-2xl border p-5',
                isCurrent ? 'border-ink bg-surface shadow-[var(--elevation-card)]' : 'border-line bg-surface'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <SocietyMark tier={tier.key} full />
                {isCurrent && (
                  <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                    Seu status
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-ink-muted">
                {Math.round(rate * 100)}% de comissão
                {tier.inviteOnly && ' · por convite'}
              </p>

              <ul className="mt-4 space-y-2.5">
                {benefits.map((b) => (
                  <li key={b.id} className="flex items-start gap-2 text-sm">
                    {unlocked ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                    ) : (
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                    )}
                    <span className={unlocked ? 'text-ink' : 'text-ink-subtle'}>{b.label}</span>
                  </li>
                ))}
              </ul>

              {!unlocked && (
                <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                  Benefícios bloqueados até {tier.name}.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
