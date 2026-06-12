import { AlertTriangle, Calendar, CheckCircle2, Wallet } from 'lucide-react'
import Link from 'next/link'
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
import {
  getPartnerKpis,
  getPartnerPayouts,
  getPartnerProfile,
  getProgramSettings,
  requireUser,
} from '@/lib/queries/partner'
import { resolveRange } from '@/lib/queries/range'
import { formatCurrency, formatDateLong } from '@/lib/format'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ComissoesPage() {
  const user = await requireUser()
  const range = resolveRange('all')

  const [kpis, payouts, profile, settings] = await Promise.all([
    getPartnerKpis(user.id, range),
    getPartnerPayouts(user.id),
    getPartnerProfile(user.id),
    getProgramSettings(),
  ])

  const totalRecebido = payouts
    .filter((p) => p.status === 'pago')
    .reduce((acc, p) => acc + Number(p.amount), 0)
  const completedCount = payouts.filter((p) => p.status === 'pago').length
  const mediaMensal = completedCount > 0 ? totalRecebido / completedCount : 0

  const ratePct = Math.round((profile?.commission_rate ?? settings?.default_commission_rate ?? 0.3) * 100)
  const hasPix = Boolean(profile?.pix_key)
  const nextPayoutLong = settings?.next_payout_date ? formatDateLong(settings.next_payout_date) : 'A definir'

  return (
    <>
      <PageHeader
        title="Pagamentos"
        subtitle="Acompanhe seus ganhos, repasses e dados de pagamento"
        actions={<NotificationBell />}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="A receber" value={formatCurrency(kpis.a_receber)} highlight note={`Próximo · ${settings?.next_payout_date ? formatDateLong(settings.next_payout_date) : 'a definir'}`} />
          <StatCard label="Total recebido" value={formatCurrency(totalRecebido)} note="Desde o início da parceria" />
          <StatCard label="Taxa de comissão" value={`${ratePct}%`} note="Por conversão confirmada" />
          <StatCard label="Média por repasse" value={formatCurrency(mediaMensal)} note={`${completedCount} repasse${completedCount === 1 ? '' : 's'} concluído${completedCount === 1 ? '' : 's'}`} />
        </div>

        {/* Payment method status */}
        <Card className="mb-6 border-line bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-ink">Dados de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-micro">Método</p>
                <div className="mt-1 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-ink-muted" />
                  <p className="font-medium text-ink">PIX</p>
                </div>
              </div>
              <div>
                <p className="text-micro">Chave PIX</p>
                {hasPix ? (
                  <div className="mt-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand" />
                    <p className="font-medium text-ink">{profile?.pix_key}</p>
                  </div>
                ) : (
                  <Link
                    href="/dashboard/configuracoes"
                    className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[#B45309]"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Defina sua chave PIX
                  </Link>
                )}
              </div>
              <div>
                <p className="text-micro">Próximo repasse</p>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-ink-muted" />
                  <p className="font-medium text-ink">{nextPayoutLong}</p>
                </div>
              </div>
            </div>
            {!hasPix && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F59E0B]/10 p-3 text-sm text-[#B45309]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Sem uma chave PIX cadastrada não conseguimos liberar seus repasses. Cadastre em{' '}
                  <Link href="/dashboard/configuracoes" className="font-medium underline">
                    Configurações
                  </Link>
                  .
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-line bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-ink">Histórico de repasses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {payouts.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="Nenhum repasse ainda"
                  description="Assim que houver saldo confirmado, seus repasses aparecem aqui com data e referência."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-line hover:bg-transparent">
                      <TableHead className="text-micro">Data</TableHead>
                      <TableHead className="text-micro">Referência</TableHead>
                      <TableHead className="text-micro">Método</TableHead>
                      <TableHead className="text-right text-micro">Valor</TableHead>
                      <TableHead className="text-micro">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p) => (
                      <TableRow key={p.id} className={cn('border-line', p.status !== 'pago' && 'bg-surface-muted/40')}>
                        <TableCell className="text-sm font-medium text-ink">
                          {p.paid_at ? formatDateLong(p.paid_at) : formatDateLong(p.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-ink-muted">{p.reference_period ?? '—'}</TableCell>
                        <TableCell className="text-sm text-ink-muted">{p.method}</TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums text-brand">
                          {formatCurrency(Number(p.amount))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
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
