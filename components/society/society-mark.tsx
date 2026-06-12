import { cn } from '@/lib/utils'
import { normalizeTierKey, tierConfig } from '@/lib/society'
import type { SocietyTierKey } from '@/lib/database.types'

// A single, restrained monochrome mark for a Society status — no per-tier rainbow
// colors, no medals. Council reads as quietly more solid (filled chip).
//
// Contrast is owned here via the `variant` prop. Parents must never override
// text/background colors through className — that's what produced unreadable
// chips on dark cards and the blank council pill.
interface SocietyMarkProps {
  tier: SocietyTierKey | string | null | undefined
  /** Show the full name ("Tetra Signature") instead of the short form. */
  full?: boolean
  size?: 'sm' | 'md'
  /** Surface the mark sits on. Defaults to a light card. */
  variant?: 'onLight' | 'onDark'
  className?: string
}

export function SocietyMark({
  tier,
  full = false,
  size = 'sm',
  variant = 'onLight',
  className,
}: SocietyMarkProps) {
  const key: SocietyTierKey = normalizeTierKey(typeof tier === 'string' ? tier : null)
  const config = tierConfig(key)
  const isTop = key === 'council'

  const surface =
    variant === 'onDark'
      ? isTop
        ? 'border-white bg-white text-[#1d1d1b]'
        : 'border-white/30 bg-white/[0.08] text-white'
      : isTop
        ? 'border-[#1d1d1b] bg-[#1d1d1b] text-white'
        : 'border-line bg-surface text-ink'

  // The teal dot is the Society signature — constant across tiers and surfaces.
  const dot = 'bg-[#0FB5A6]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium tracking-tight',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        surface,
        className
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
      {full ? config.name : config.short}
    </span>
  )
}
