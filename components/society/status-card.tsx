import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { SocietyMark } from '@/components/society/society-mark'
import { tierConfig } from '@/lib/society'
import { formatDateLong } from '@/lib/format'
import type { SocietyTierKey } from '@/lib/database.types'

interface StatusCardProps {
  tier: SocietyTierKey
  commissionRate: number
  sinceDate: string | null
}

export function SocietyStatusCard({ tier, commissionRate, sinceDate }: StatusCardProps) {
  const config = tierConfig(tier)
  const ratePct = Math.round(commissionRate * 100)

  return (
    <section className="overflow-hidden rounded-2xl bg-ink p-6 text-surface md:p-8">
      <div className="flex items-center gap-2 text-sm text-white/55">
        <ShieldCheck className="h-4 w-4" />
        <span className="font-medium uppercase tracking-[0.08em] text-[11px]">Status atual · Tetra Society</span>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-xl">
          <SocietyMark tier={tier} full size="md" className="border-white/25 bg-white/10 text-surface" />
          <p className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-[28px]">
            {config.standing}
          </p>
          <p className="mt-2 text-sm text-white/60">{config.blurb}</p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">Comissão por conversão</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">{ratePct}%</p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-sm text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="h-4 w-4 text-white/70" />
          Parceiro aprovado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="h-4 w-4 text-white/70" />
          Histórico validado
        </span>
        {sinceDate && <span className="text-white/45">Membro desde {formatDateLong(sinceDate)}</span>}
      </div>
    </section>
  )
}
