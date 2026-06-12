export type DateRange = '7d' | '30d' | '90d' | 'all'

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '7d',  label: '7 dias'   },
  { value: '30d', label: '30 dias'  },
  { value: '90d', label: '90 dias'  },
  { value: 'all', label: 'Tudo'     },
]

export function parseDateRange(value: string | string[] | undefined): DateRange {
  const v = Array.isArray(value) ? value[0] : value
  if (v === '7d' || v === '30d' || v === '90d' || v === 'all') return v
  return '30d'
}

export interface ResolvedRange {
  range: DateRange
  from: string         // ISO
  to: string           // ISO
  bucket: 'day' | 'week' | 'month'
  label: string
}

const DAY_MS = 86_400_000
// Start of the program — anything older than this isn't relevant.
const PROGRAM_EPOCH = new Date('2024-01-01T00:00:00.000Z')

export function resolveRange(range: DateRange, now: Date = new Date()): ResolvedRange {
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)

  if (range === 'all') {
    return {
      range,
      from: PROGRAM_EPOCH.toISOString(),
      to: to.toISOString(),
      bucket: 'month',
      label: 'Tudo',
    }
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const from = new Date(to.getTime() - (days - 1) * DAY_MS)
  from.setHours(0, 0, 0, 0)

  return {
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    bucket: days <= 30 ? 'day' : 'week',
    label: range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias',
  }
}
