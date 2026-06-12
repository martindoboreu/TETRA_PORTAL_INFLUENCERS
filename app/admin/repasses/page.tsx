import Link from 'next/link'
import { Download, Wallet, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MarkPaidButton } from '@/components/admin/mark-paid-button'
import { SocietyMark } from '@/components/society/society-mark'
import { getPartnerRollup, getPartnerLabels, getPartnerSocietyMap } from '@/lib/queries/admin'
import { createClient } from '@/lib/supabase/server'
import { resolveRange } from '@/lib/queries/range'
import { formatCurrency, formatDateLong, formatNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function RepassesPage() {
  const rollup = await getPartnerRollup(resolveRange('all'))
  const supabase = await createClient()
  const [{ data: recentPayouts }, labels, societyMap] = await Promise.all([
    supabase
      .from('payouts')
      .select('id, partner_id, amount, method, status, reference_period, paid_at, created_at')
      .eq('status', 'pago')
      .order('paid_at', { ascending: false })
      .limit(15),
    getPartnerLabels(),
    getPartnerSocietyMap(),
  ])

  const owed = rollup.filter((p) => Number(p.a_receber) > 0)
  const totalOwed = owed.reduce((acc, p) => acc + Number(p.a_receber), 0)
  const totalPaid = (recentPayouts ?? []).reduce((acc, p) => acc + Number(p.amount), 0)

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1b] sm:text-xl">Repasses</h1>
            <p className="mt-0.5 hidden text-sm text-[#6B7280] sm:block">
              Saldos a pagar e histórico de repasses
            </p>
          </div>
          <Button asChild variant="outline" className="border-[#E5E5E5]">
            <Link href="/admin/repasses/export" prefetch={false}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-[#E5E5E5] bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B7280]">Total a repassar</p>
                <Wallet className="h-5 w-5 text-[#0FB5A6]" />
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#0FB5A6]">{formatCurrency(totalOwed)}</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E5E5] bg-white">
            <CardContent className="pt-6">
              <p className="text-sm text-[#6B7280]">Parceiros com saldo</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#1d1d1b]">{formatNumber(owed.length)}</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E5E5] bg-white">
            <CardContent className="pt-6">
              <p className="text-sm text-[#6B7280]">Pago (últimos repasses)</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#1d1d1b]">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-[#E5E5E5] bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1d1d1b]">Saldos pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {owed.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6B7280]">Nenhum saldo pendente. Tudo em dia.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E5E5E5]">
                      <TableHead className="text-xs font-medium text-[#6B7280]">Parceiro</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Status</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Conversões</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">A repassar</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owed.map((p) => (
                      <TableRow key={p.partner_id} className="border-[#E5E5E5]">
                        <TableCell>
                          <Link href={`/admin/parceiros/${p.partner_id}`} className="flex items-center gap-3 hover:underline">
                            <Avatar className="h-9 w-9 border border-[#E5E5E5]">
                              <AvatarFallback className="bg-[#1d1d1b] text-xs text-[#f6f6f6]">
                                {p.avatar_initials ?? '–'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-[#1d1d1b]">{p.full_name ?? 'Parceiro'}</p>
                              <p className="text-xs text-[#6B7280]">{p.handle ? `@${p.handle}` : '—'}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <SocietyMark tier={societyMap.get(p.partner_id) ?? 'select'} full />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-[#1d1d1b]">{formatNumber(p.conversoes)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums text-[#0FB5A6]">{formatCurrency(p.a_receber)}</TableCell>
                        <TableCell className="text-right">
                          <MarkPaidButton partnerId={p.partner_id} amount={Number(p.a_receber)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1d1d1b]">Repasses recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {(recentPayouts ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6B7280]">Nenhum repasse realizado ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E5E5E5]">
                      <TableHead className="text-xs font-medium text-[#6B7280]">Data</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Parceiro</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Referência</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Método</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Valor</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentPayouts ?? []).map((p) => {
                      const label = labels.get(p.partner_id)
                      return (
                        <TableRow key={p.id} className="border-[#E5E5E5]">
                          <TableCell className="whitespace-nowrap text-sm text-[#6B7280]">
                            {p.paid_at ? formatDateLong(p.paid_at) : formatDateLong(p.created_at)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-[#1d1d1b]">{label?.full_name ?? 'Parceiro'}</TableCell>
                          <TableCell className="text-sm text-[#6B7280]">{p.reference_period ?? '—'}</TableCell>
                          <TableCell className="text-sm text-[#6B7280]">{p.method}</TableCell>
                          <TableCell className="text-right text-sm font-semibold tabular-nums text-[#0FB5A6]">{formatCurrency(Number(p.amount))}</TableCell>
                          <TableCell>
                            <Badge className="bg-[#0FB5A6]/15 text-[#0E9F92]">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Pago
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
