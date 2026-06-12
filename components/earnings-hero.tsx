import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercentage } from '@/lib/format'

interface EarningsHeroProps {
  /** Commission earned within the selected period. */
  periodCommission: number
  periodCommissionDelta: number
  /** Balance awaiting the next payout. */
  pendingCommission: number
  nextPayoutLabel: string
  /** Partner's own commission rate as a percentage (e.g. 30). */
  commissionRatePct: number
  rangeLabel: string
  /** Full Society status name, e.g. "Tetra Signature". */
  societyTierName: string
}

export function EarningsHero({
  periodCommission,
  periodCommissionDelta,
  pendingCommission,
  nextPayoutLabel,
  commissionRatePct,
  rangeLabel,
  societyTierName,
}: EarningsHeroProps) {
  const isPositive = periodCommissionDelta >= 0

  return (
    <section className="animate-fade-slide-up overflow-hidden rounded-2xl bg-[#1d1d1b] p-6 text-white shadow-[var(--elevation-card)] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-white/50">
            Comissão confirmada · {rangeLabel}
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {formatCurrency(periodCommission)}
          </p>
          {periodCommissionDelta !== 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-brand" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-[#F87171]" />
              )}
              <span className={cn('tabular-nums', isPositive ? 'text-brand' : 'text-[#F87171]')}>
                {periodCommissionDelta > 0 ? '+' : ''}
                {formatPercentage(periodCommissionDelta)}
              </span>
              <span className="text-white/40">vs. período anterior</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5 self-center border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <HeroStat label="A receber" value={formatCurrency(pendingCommission)} accent />
          <HeroStat label="Próximo repasse" value={nextPayoutLabel} />
          <HeroStat label="Sua comissão" value={`${commissionRatePct}%`} />
          <HeroStat label="Status" value={societyTierName} />
        </div>
      </div>
    </section>
  )
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-white/50">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          accent ? 'text-brand' : 'text-white'
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function HeroLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-strong"
    >
      {children}
      <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}
