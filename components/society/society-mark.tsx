import { cn } from '@/lib/utils'
import { normalizeTierKey, tierConfig } from '@/lib/society'
import type { SocietyTierKey } from '@/lib/database.types'

// A single, restrained monochrome mark for a Society status — no per-tier rainbow
// colors, no medals. Higher tiers read as quietly more solid (ink fill on Council).
interface SocietyMarkProps {
  tier: SocietyTierKey | string | null | undefined
  /** Show the full name ("Tetra Signature") instead of the short form. */
  full?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function SocietyMark({ tier, full = false, size = 'sm', className }: SocietyMarkProps) {
  const key: SocietyTierKey = normalizeTierKey(typeof tier === 'string' ? tier : null)
  const config = tierConfig(key)
  const isTop = key === 'council'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        isTop
          ? 'border-ink bg-ink text-surface'
          : 'border-line bg-surface text-ink',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isTop ? 'bg-surface' : 'bg-ink'
        )}
      />
      {full ? config.name : config.short}
    </span>
  )
}
