'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function AnimatedValue({ value, delay }: { value: string; delay: number }) {
  const [display, setDisplay] = useState('0')
  const [animating, setAnimating] = useState(true)

  useEffect(() => {
    setAnimating(true)
    setDisplay('0')
    const t = setTimeout(() => {
      setDisplay(value)
      setAnimating(false)
    }, delay + 100)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <span
      className={cn(
        'transition-all duration-500',
        animating ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      {display}
    </span>
  )
}

export interface StatCardProps {
  label: string
  value: string
  /** Signed delta. Renders a trend arrow + colored value unless `note` is set. */
  delta?: number
  /** Suffix for the delta value (e.g. " p.p."). */
  deltaSuffix?: string
  /** Replaces the delta line with neutral helper text (e.g. "Próximo: 05 jul"). */
  note?: string
  /** Emphasize the value in brand color (used for money). */
  highlight?: boolean
  /** Animate the value in. Provide an index-based delay in ms. */
  delay?: number
}

function formatDelta(delta: number, suffix?: string): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1).replace('.', ',')}%${suffix ?? ''}`
}

export function StatCard({ label, value, delta, deltaSuffix, note, highlight, delay }: StatCardProps) {
  const animated = typeof delay === 'number'
  const isPositive = (delta ?? 0) >= 0
  const showTrend = delta !== undefined && delta !== 0 && !note

  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)] transition-shadow hover:shadow-[var(--elevation-card-hover)]',
        animated && 'animate-fade-slide-up'
      )}
      style={animated ? { animationDelay: `${delay}ms` } : undefined}
    >
      <p className="text-micro">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
          highlight ? 'text-brand' : 'text-ink'
        )}
      >
        {animated ? <AnimatedValue value={value} delay={delay!} /> : value}
      </p>
      {(note || delta !== undefined) && (
        <div className="mt-2 flex items-center gap-1">
          {showTrend &&
            (isPositive ? (
              <TrendingUp className="h-3 w-3 text-brand" />
            ) : (
              <TrendingDown className="h-3 w-3 text-[#EF4444]" />
            ))}
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              note ? 'text-ink-muted' : isPositive ? 'text-brand' : 'text-[#EF4444]'
            )}
          >
            {note ?? formatDelta(delta ?? 0, deltaSuffix)}
          </span>
        </div>
      )}
    </div>
  )
}
