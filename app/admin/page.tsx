import Link from 'next/link'
import { Calendar, Users, MousePointerClick, TrendingUp, Wallet, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PerformanceChart } from '@/components/performance-chart'
import { DateRangeSelector } from '@/components/date-range-selector'
import {
  getAdminChart,
  getAdminKpis,
  getAdminRecentConversions,
  getPartnerLabels,
  getPartnerRollup,
  getPendingPartners,
} from '@/lib/queries/admin'
import { parseDateRange, resolveRange } from '@/lib/queries/range'
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
} from '@/lib/format'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  pago: 'bg-[#0FB5A6]/15 text-[#0E9F92]',
  confirmado: 'bg-amber-500/15 text-amber-600',
  reembolsado: 'bg-red-500/15 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  pago: 'Pago',
  confirmado: 'Confirmado',
  reembolsado: 'Reembolsado',
}

interface AdminOverviewProps {
  searchParams: Promise<{ range?: string }>
}

export default async function AdminOverviewPage({ searchParams }: AdminOverviewProps) {
  const { range: rangeParam } = await searchParams
  const range = resolveRange(parseDateRange(rangeParam))

  const [kpis, chart, rollup, recent, labels, pending] = await Promise.all([
    getAdminKpis(range),
    getAdminChart(range),
    getPartnerRollup(range),
    getAdminRecentConversions(8),
    getPartnerLabels(),
    getPendingPartners(),
  ])

  const topPartners = rollup.slice(0, 5)
  const totalARepassar = kpis.a_repassar

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1b] sm:text-xl">
              Visão Geral
            </h1>
            <p className="mt-0.5 hidden text-sm text-[#6B7280] sm:block">
              Desempenho de todo o programa de parceiros
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <DateRangeSelector value={range.range} />
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-[#f6f6f6] px-3 py-1.5 text-sm text-[#6B7280] md:flex">
              <Users className="h-4 w-4" />
              <span>{formatNumber(kpis.parceiros_ativos)} parceiros ativos</span>
            </div>
          </div>
        </div>
        <div className="border-t border-[#E5E5E5] px-4 py-3 sm:hidden">
          <DateRangeSelector value={range.range} />
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {pending.length > 0 && (
          <Link
            href="/admin/aprovacoes"
            className="mb-6 flex items-center justify-between rounded-2xl border border-[#0FB5A6]/30 bg-[#0FB5A6]/5 px-5 py-4 transition-colors hover:bg-[#0FB5A6]/10"
          >
            <div>
              <p className="text-sm font-medium text-[#1d1d1b]">
                {pending.length} {pending.length === 1 ? 'parceiro aguardando' : 'parceiros aguardando'} aprovação
              </p>
              <p className="mt-0.5 text-xs text-[#6B7280]">Revise e aprove para liberar o acesso ao portal.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#0FB5A6]" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <AdminKpi label="Cliques" value={formatNumber(kpis.cliques)} icon={<MousePointerClick className="h-4 w-4 text-[#6B7280]" />} />
          <AdminKpi label="Leads" value={formatNumber(kpis.leads)} />
          <AdminKpi label="Conversões" value={formatNumber(kpis.conversoes)} />
          <AdminKpi label="Taxa de conversão" value={formatPercentage(kpis.taxa_conversao)} />
          <AdminKpi label="Comissão (período)" value={formatCurrency(kpis.comissao_total)} highlight />
          <AdminKpi label="Total a repassar" value={formatCurrency(totalARepassar)} icon={<Wallet className="h-4 w-4 text-[#6B7280]" />} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PerformanceChart data={chart} />
          </div>

          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-[#1d1d1b]">Top parceiros</CardTitle>
              <Link href="/admin/parceiros" className="text-xs font-medium text-[#0FB5A6] hover:underline">
                Ver todos
              </Link>
            </CardHeader>
            <CardContent>
              {topPartners.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6B7280]">Sem dados no período.</p>
              ) : (
                <div className="space-y-3">
                  {topPartners.map((p, i) => (
                    <Link
                      key={p.partner_id}
                      href={`/admin/parceiros/${p.partner_id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#f6f6f6]"
                    >
                      <span className="w-4 text-sm font-semibold tabular-nums text-[#9CA3AF]">{i + 1}</span>
                      <Avatar className="h-9 w-9 border border-[#E5E5E5]">
                        <AvatarFallback className="bg-[#1d1d1b] text-xs text-[#f6f6f6]">
                          {p.avatar_initials ?? '–'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1d1d1b]">{p.full_name ?? 'Parceiro'}</p>
                        <p className="truncate text-xs text-[#6B7280]">{formatNumber(p.conversoes)} conversões</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-[#0FB5A6]">{formatCurrency(p.comissao)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-[#1d1d1b]">Repasses pendentes</CardTitle>
              <Link href="/admin/repasses" className="text-xs font-medium text-[#0FB5A6] hover:underline">
                Gerenciar
              </Link>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-[#f6f6f6] p-4">
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Calendar className="h-4 w-4" />
                  <span>Total a repassar (todos os parceiros)</span>
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-[#0FB5A6]">
                  {formatCurrency(totalARepassar)}
                </p>
              </div>
              {rollup.filter((p) => Number(p.a_receber) > 0).length === 0 ? (
                <p className="mt-4 text-sm text-[#6B7280]">Nenhum saldo pendente no momento.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {rollup
                    .filter((p) => Number(p.a_receber) > 0)
                    .slice(0, 5)
                    .map((p) => (
                      <div key={p.partner_id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-[#1d1d1b]">{p.full_name ?? 'Parceiro'}</span>
                        <span className="tabular-nums font-medium text-[#1d1d1b]">{formatCurrency(p.a_receber)}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-[#1d1d1b]">Conversões recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6B7280]">Nenhuma conversão recente.</p>
              ) : (
                <div className="space-y-3">
                  {recent.map((c) => {
                    const label = labels.get(c.partner_id)
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[#f6f6f6]">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#1d1d1b]">{c.buyer_masked}</span>
                            <Badge className={STATUS_STYLES[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                            {c.course} · {label?.full_name ?? 'Parceiro'}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium tabular-nums text-[#1d1d1b]">{formatCurrency(Number(c.commission))}</p>
                          <p className="text-xs text-[#6B7280]">{formatRelativeTime(c.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function AdminKpi({
  label,
  value,
  highlight,
  icon,
}: {
  label: string
  value: string
  highlight?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">{label}</p>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${highlight ? 'text-[#0FB5A6]' : 'text-[#1d1d1b]'}`}>
        {value}
      </p>
    </div>
  )
}
