import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { SocietyMark } from '@/components/society/society-mark'
import { SOCIETY_BENEFITS, isUnlocked, nextTier, tierConfig } from '@/lib/society'
import { formatDateLong } from '@/lib/format'
import type { SocietyTierKey } from '@/lib/database.types'

interface StatusCardProps {
  tier: SocietyTierKey
  commissionRate: number
  sinceDate: string | null
}

export function SocietyStatusCard({ tier, commissionRate, sinceDate }: StatusCardProps) {
  const config = tierConfig(tier)
  const upcoming = nextTier(tier)
  const ratePct = Math.round(commissionRate * 100)
  const unlockedCount = SOCIETY_BENEFITS.filter((b) => isUnlocked(b, tier)).length

  const stats: { label: string; value: string; accent?: boolean }[] = [
    { label: 'Comissão atual', value: `${ratePct}%`, accent: true },
    { label: 'Membro desde', value: sinceDate ? formatDateLong(sinceDate) : '—' },
    {
      label: 'Próximo convite',
      value: upcoming ? upcoming.name : 'Nível máximo',
    },
    {
      label: 'Benefícios liberados',
      value: `${unlockedCount} de ${SOCIETY_BENEFITS.length}`,
    },
  ]

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#1d1d1b] p-6 text-white md:p-8">
      {/* Quiet premium texture: a faint teal aura + an oversized ghost monogram. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#0FB5A6]/[0.13] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-6 select-none text-[120px] font-semibold leading-none tracking-tighter text-white/[0.04]"
      >
        {config.short}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 text-white/60">
          <ShieldCheck className="h-4 w-4 text-[#0FB5A6]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
            Tetra Society · Status atual
          </span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <div className="max-w-xl">
            <SocietyMark tier={tier} full size="md" variant="onDark" />
            <p className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-[28px]">
              {config.standing}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{config.blurb}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 self-center border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/55">
                  {s.label}
                </dt>
                <dd
                  className={
                    'mt-1 text-lg font-semibold tracking-tight tabular-nums ' +
                    (s.accent ? 'text-[#0FB5A6]' : 'text-white')
                  }
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-sm text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-[#0FB5A6]" />
            Parceiro validado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-[#0FB5A6]" />
            Histórico validado
          </span>
          {upcoming && (
            <span className="text-white/55">
              Convites são estendidos pela equipe Tetra após avaliação do histórico.
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
