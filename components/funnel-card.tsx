'use client'

import { formatNumber } from '@/lib/format'

interface FunnelCardProps {
  data: {
    cliques: number
    leads: number
    matriculas: number
    pagos: number
  }
}

export function FunnelCard({ data }: FunnelCardProps) {
  const maxValue = Math.max(data.cliques, 1)
  const stages = [
    { label: 'Cliques',    value: data.cliques,    color: '#E5E5E5' },
    { label: 'Leads',      value: data.leads,      color: '#D1D5DB' },
    { label: 'Matrículas', value: data.matriculas, color: '#9CA3AF' },
    { label: 'Pagos',      value: data.pagos,      color: '#0FB5A6' },
  ]

  return (
    <div className="animate-fade-slide-up rounded-2xl border border-line bg-white p-6 shadow-[var(--elevation-card)]">
      <h3 className="text-base font-semibold text-ink">Funil de conversão</h3>
      <div className="mt-6 space-y-4">
        {stages.map((stage, index) => {
          const percentage = (stage.value / maxValue) * 100
          return (
            <div key={stage.label} className="flex items-center gap-4">
              <div className="w-20 text-right">
                <span className="text-micro">{stage.label}</span>
              </div>
              <div className="relative flex-1">
                <div className="h-8 w-full overflow-hidden rounded-lg bg-surface-muted">
                  <div
                    className="flex h-full items-center justify-end rounded-lg px-3 transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(percentage, 8)}%`,
                      backgroundColor: stage.color,
                    }}
                  >
                    <span className="text-xs font-medium tabular-nums text-ink">
                      {formatNumber(stage.value)}
                    </span>
                  </div>
                </div>
              </div>
              {index < stages.length - 1 ? (
                <div className="w-12 text-center text-xs text-ink-muted">→</div>
              ) : (
                <div className="w-12" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
