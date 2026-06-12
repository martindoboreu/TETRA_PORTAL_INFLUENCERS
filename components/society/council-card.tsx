import { Lock } from 'lucide-react'
import { SOCIETY_BENEFITS } from '@/lib/society'

// Council is aspiration, not a goal with criteria. The benefits are visible but
// locked — institutional desire, no gamification.
export function CouncilCard() {
  const councilBenefits = SOCIETY_BENEFITS.filter((b) => b.minTier === 'council')

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1d1d1b]/15 bg-[#1d1d1b] p-6 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -bottom-28 h-72 w-72 rounded-full bg-[#0FB5A6]/[0.10] blur-3xl"
      />

      <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Tetra Council</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-white/90">
              <Lock className="h-3 w-3" /> Acesso por convite
            </span>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
            Reservado para parceiros convidados diretamente pela equipe Tetra.
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
            Sem critérios públicos. O acesso considera influência estratégica, qualidade de
            conteúdo e alinhamento com a marca.
          </p>
        </div>

        <ul className="grid gap-2 self-center border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {councilBenefits.map((b) => (
            <li key={b.id} className="flex items-center gap-2.5 text-sm text-white/80">
              <Lock className="h-3.5 w-3.5 shrink-0 text-white/40" />
              {b.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
