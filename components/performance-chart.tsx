'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatNumber, formatDateShort } from '@/lib/format'

export interface ChartPoint {
  bucket: string
  cliques: number
  conversoes: number
}

interface PerformanceChartProps {
  data: ChartPoint[]
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDateShort(d.bucket),
  }))

  return (
    <div className="animate-fade-slide-up rounded-2xl border border-line bg-white p-6 shadow-[var(--elevation-card)]">
      <h3 className="text-base font-semibold text-ink">Desempenho ao longo do tempo</h3>
      <div className="mt-6 h-[280px]">
        {chartData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-ink">Sem dados no período</p>
            <p className="mt-1 max-w-xs text-sm text-ink-muted">
              Assim que seus links receberem cliques e conversões, a evolução aparece aqui.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCliques" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d1d1b" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#1d1d1b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConversoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0FB5A6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0FB5A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                dx={-10}
                tickFormatter={(value) => formatNumber(value as number)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                dx={10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '12px 16px',
                }}
                labelStyle={{ color: '#1d1d1b', fontWeight: 600, marginBottom: 8 }}
                formatter={(value: number, name: string) => [
                  formatNumber(value),
                  name === 'cliques' ? 'Cliques' : 'Conversões',
                ]}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cliques"
                stroke="#1d1d1b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCliques)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="conversoes"
                stroke="#0FB5A6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorConversoes)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-ink" />
          <span className="text-xs text-ink-muted">Cliques</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-brand" />
          <span className="text-xs text-ink-muted">Conversões</span>
        </div>
      </div>
    </div>
  )
}
