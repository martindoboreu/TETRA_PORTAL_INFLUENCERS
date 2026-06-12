'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import { Link2 } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format'

export interface LinkPerformanceRow {
  link_id: string
  label: string
  slug: string
  cliques: number
  leads: number
  conversoes: number
  taxa_conversao: number
  comissao: number
}

interface LinkPerformanceTableProps {
  data: LinkPerformanceRow[]
}

export function LinkPerformanceTable({ data }: LinkPerformanceTableProps) {
  return (
    <div className="animate-fade-slide-up overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--elevation-card)]">
      <div className="p-6 pb-4">
        <h3 className="text-base font-semibold text-ink">Desempenho por link</h3>
      </div>
      {data.length === 0 ? (
        <div className="px-6 pb-6">
          <EmptyState
            compact
            icon={Link2}
            title="Nenhum link com tráfego no período"
            description="Ajuste o período ou divulgue seus links para ver os resultados aqui."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-line hover:bg-transparent">
              <TableHead className="text-micro">Origem</TableHead>
              <TableHead className="text-right text-micro">Cliques</TableHead>
              <TableHead className="text-right text-micro">Leads</TableHead>
              <TableHead className="text-right text-micro">Conversões</TableHead>
              <TableHead className="text-right text-micro">Conv. %</TableHead>
              <TableHead className="text-right text-micro">Comissão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.link_id} className="border-line transition-colors hover:bg-surface-muted">
                <TableCell className="text-sm font-medium text-ink">{row.label}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-ink">{formatNumber(row.cliques)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-ink">{formatNumber(row.leads)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-ink">{formatNumber(row.conversoes)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-ink">{formatPercentage(row.taxa_conversao)}</TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums text-ink">{formatCurrency(row.comissao)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
