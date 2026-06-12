'use client'

import { formatCurrency, formatDateLong, formatDateShort } from '@/lib/format'

export interface PayoutHistoryItem {
  id: string
  amount: number
  method: string
  status: 'pago' | 'pendente'
  paid_at: string | null
  reference_period: string | null
}

interface PayoutCardProps {
  aReceber: number
  nextPayoutDate: string | null
  history: PayoutHistoryItem[]
}

export function PayoutCard({ aReceber, nextPayoutDate, history }: PayoutCardProps) {
  const recent = history.filter((p) => p.status === 'pago').slice(0, 3)

  return (
    <div className="animate-fade-slide-up rounded-2xl border border-line bg-white p-6 shadow-[var(--elevation-card)]">
      <h3 className="text-base font-semibold text-ink">Comissões e repasses</h3>

      <div className="mt-4 rounded-xl bg-surface-muted p-4">
        <p className="text-micro">Saldo a receber</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">
          {formatCurrency(aReceber)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-line p-3">
        <div>
          <p className="text-xs text-ink-muted">Próximo repasse</p>
          <p className="mt-0.5 text-sm font-medium text-ink">
            {nextPayoutDate ? `${formatDateShort(nextPayoutDate)} · via PIX` : 'A combinar · via PIX'}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15">
          <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-micro">Histórico recente</p>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nenhum repasse realizado ainda.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {recent.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{p.paid_at ? formatDateLong(p.paid_at) : '—'}</span>
                <span className="font-medium tabular-nums text-ink">{formatCurrency(p.amount)}</span>
                <span className="text-xs text-ink-muted">Pago via {p.method}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
