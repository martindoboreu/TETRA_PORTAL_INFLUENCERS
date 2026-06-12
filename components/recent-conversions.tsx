'use client'

import { Receipt } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface RecentConversionItem {
  id: string
  buyer_masked: string
  course: string
  commission: number
  status: 'pago' | 'confirmado' | 'reembolsado'
  created_at: string
}

interface RecentConversionsProps {
  data: RecentConversionItem[]
}

export function RecentConversions({ data }: RecentConversionsProps) {
  return (
    <div className="animate-fade-slide-up rounded-2xl border border-line bg-white p-6 shadow-[var(--elevation-card)]">
      <h3 className="text-base font-semibold text-ink">Conversões recentes</h3>
      {data.length === 0 ? (
        <EmptyState
          compact
          icon={Receipt}
          title="Nenhuma conversão ainda"
          description="Compartilhe seu link para registrar as primeiras vendas atribuídas."
        />
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-surface-muted',
                item.status === 'reembolsado' && 'opacity-60'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{item.buyer_masked}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-muted">{item.course}</p>
              </div>
              <div className="ml-4 text-right">
                <p
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    item.status === 'reembolsado' ? 'text-ink-muted line-through' : 'text-ink'
                  )}
                >
                  {formatCurrency(item.commission)}
                </p>
                <p className="text-xs text-ink-muted">{formatRelativeTime(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
