import { Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { StatusBadge } from '@/components/status-badge'
import { StatCard } from '@/components/stat-card'
import { EmptyState } from '@/components/empty-state'
import { DateRangeSelector } from '@/components/date-range-selector'
import { ConversionFilters } from '@/components/conversion-filters'
import { getPartnerConversions, requireUser } from '@/lib/queries/partner'
import { parseDateRange, resolveRange } from '@/lib/queries/range'
import { formatCurrency, formatDateLong, formatNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

interface ConversoesPageProps {
  searchParams: Promise<{ range?: string; q?: string; status?: string }>
}

export default async function ConversoesPage({ searchParams }: ConversoesPageProps) {
  const { range: rangeParam, q, status } = await searchParams
  const range = resolveRange(parseDateRange(rangeParam))
  const user = await requireUser()

  const statusFilter =
    status === 'pago' || status === 'confirmado' || status === 'reembolsado' ? status : 'todos'

  const conversions = await getPartnerConversions(user.id, range, {
    search: q,
    status: statusFilter,
  })

  const totalComissao = conversions.reduce(
    (acc, c) => (c.status !== 'reembolsado' ? acc + Number(c.commission) : acc),
    0
  )
  const pagas = conversions.filter((c) => c.status === 'pago').length
  const pendentes = conversions.filter((c) => c.status === 'confirmado').length

  return (
    <>
      <PageHeader
        title="Conversões"
        subtitle="Histórico de todas as suas vendas atribuídas"
        actions={
          <>
            <div className="hidden sm:block">
              <DateRangeSelector value={range.range} />
            </div>
            <NotificationBell />
          </>
        }
        mobileActions={<DateRangeSelector value={range.range} />}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total no período" value={formatNumber(conversions.length)} />
          <StatCard label="Pagas" value={formatNumber(pagas)} highlight />
          <StatCard label="Confirmadas" value={formatNumber(pendentes)} />
          <StatCard label="Comissão (líquida)" value={formatCurrency(totalComissao)} />
        </div>

        <Card className="border-line bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold text-ink">
                Histórico de conversões
              </CardTitle>
              <ConversionFilters initialSearch={q ?? ''} initialStatus={statusFilter} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {conversions.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="Nenhuma conversão encontrada"
                  description="Ajuste os filtros ou o período selecionado para ver suas conversões."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-line hover:bg-transparent">
                      <TableHead className="text-micro">Data</TableHead>
                      <TableHead className="text-micro">Comprador</TableHead>
                      <TableHead className="text-micro">Curso</TableHead>
                      <TableHead className="text-right text-micro">Valor</TableHead>
                      <TableHead className="text-right text-micro">Comissão</TableHead>
                      <TableHead className="text-micro">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversions.map((c) => (
                      <TableRow key={c.id} className="border-line">
                        <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                          {formatDateLong(c.created_at)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-ink">{c.buyer_masked}</p>
                          <p className="text-xs text-ink-subtle">Identificação mascarada</p>
                        </TableCell>
                        <TableCell className="text-sm text-ink">{c.course}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-ink">
                          {formatCurrency(Number(c.amount))}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums text-brand">
                          {formatCurrency(Number(c.commission))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
