import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import { SocietyMark } from '@/components/society/society-mark'
import { tierConfig, firstLockedBenefit } from '@/lib/society'
import type { SocietyTierKey } from '@/lib/database.types'

interface StatusStripProps {
  tier: SocietyTierKey
}

export function SocietyStatusStrip({ tier }: StatusStripProps) {
  const config = tierConfig(tier)
  const locked = firstLockedBenefit(tier)

  // Aspiration teaser: the next benefit a partner doesn't yet have, framed as
  // private access rather than a reward to grind for.
  const teaser = locked
    ? locked.minTier === 'council'
      ? `${locked.label} — reservado ao Tetra Council, por convite.`
      : `${locked.label} — liberado a partir de ${tierConfig(locked.minTier).name}.`
    : 'Você já tem acesso a todos os benefícios da Tetra Society.'

  return (
    <section className="tetra-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <SocietyMark tier={tier} full />
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
            Status na Tetra Society
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-ink">{config.standing}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
          <Lock className="h-3 w-3 shrink-0" />
          {teaser}
        </p>
      </div>

      <Link
        href="/dashboard/society"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
      >
        Ver seu status na Tetra Society
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  )
}
