const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const NUM = new Intl.NumberFormat('pt-BR')

const DATE_SHORT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

const DATE_LONG = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatCurrency(value: number | null | undefined): string {
  return BRL.format(value ?? 0)
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  return BRL_COMPACT.format(value ?? 0)
}

export function formatNumber(value: number | null | undefined): string {
  return NUM.format(value ?? 0)
}

export function formatFollowers(value: number | null | undefined): string {
  const n = value ?? 0
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace('.', ',') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1).replace('.', ',') + 'k'
  return NUM.format(n)
}

export function formatPercentage(value: number | null | undefined, digits = 1): string {
  return (value ?? 0).toFixed(digits).replace('.', ',') + '%'
}

export function formatDateShort(value: string | Date): string {
  return DATE_SHORT.format(new Date(value))
}

export function formatDateLong(value: string | Date): string {
  return DATE_LONG.format(new Date(value))
}

export function formatDateTime(value: string | Date): string {
  return DATE_TIME.format(new Date(value))
}

const RTF = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatRelativeTime(value: string | Date): string {
  const then = new Date(value).getTime()
  const now = Date.now()
  const diffMs = then - now
  const diffMin = Math.round(diffMs / 60_000)
  const absMin = Math.abs(diffMin)
  if (absMin < 60) return RTF.format(diffMin, 'minute')
  const diffHr = Math.round(diffMs / 3_600_000)
  if (Math.abs(diffHr) < 24) return RTF.format(diffHr, 'hour')
  const diffDay = Math.round(diffMs / 86_400_000)
  if (Math.abs(diffDay) < 30) return RTF.format(diffDay, 'day')
  const diffMonth = Math.round(diffDay / 30)
  return RTF.format(diffMonth, 'month')
}
