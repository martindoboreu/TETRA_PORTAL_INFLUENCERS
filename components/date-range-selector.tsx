'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { DATE_RANGES, type DateRange } from '@/lib/queries/range'

interface DateRangeSelectorProps {
  value: DateRange
}

export function DateRangeSelector({ value }: DateRangeSelectorProps) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const change = (next: DateRange) => {
    const search = new URLSearchParams(params.toString())
    if (next === '30d') search.delete('range')
    else search.set('range', next)
    const qs = search.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="inline-flex rounded-full border border-[#E5E5E5] bg-[#f6f6f6] p-1">
      {DATE_RANGES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => change(option.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-sm font-medium transition-all sm:px-4',
            value === option.value
              ? 'bg-white text-[#1d1d1b] shadow-sm'
              : 'text-[#6B7280] hover:text-[#1d1d1b]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
