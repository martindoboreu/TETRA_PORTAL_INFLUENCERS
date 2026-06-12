import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Link2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PartnerActions } from '@/components/admin/partner-actions'
import { MarkPaidButton } from '@/components/admin/mark-paid-button'
import { SocietyMark } from '@/components/society/society-mark'
import {
  getPartnerConversionsAdmin,
  getPartnerDetail,
  getPartnerLinksAdmin,
  getPartnerPayoutsAdmin,
  getPartnerIntegrationsAdmin,
  getPartnerEvaluation,
} from '@/lib/queries/admin'
import { getPartnerKpis } from '@/lib/queries/partner'
import { resolveRange } from '@/lib/queries/range'
import { formatCurrency, formatDateLong, formatNumber, formatFollowers } from '@/lib/format'
import { normalizeTierKey } from '@/lib/society'
import { PROVIDERS } from '@/lib/integrations/providers'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-[#0FB5A6]/15 text-[#0E9F92]',
  pendente: 'bg-amber-500/15 text-amber-600',
  inativo: 'bg-[#6B7280]/10 text-[#6B7280]',
}

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  inativo: 'Inativo',
}

const CONV_STATUS_STYLES: Record<string, string> = {
  pago: 'bg-[#0FB5A6]/15 text-[#0E9F92]',
  confirmado: 'bg-amber-500/15 text-amber-600',
  reembolsado: 'bg-red-500/15 text-red-600',
}

const CONV_STATUS_LABEL: Record<string, string> = {
  pago: 'Pago',
  confirmado: 'Confirmado',
  reembolsado: 'Reembolsado',
}

interface PartnerDetailProps {
  params: Promise<{ id: string }>
}

export default async function PartnerDetailPage({ params }: PartnerDetailProps) {
  const { id } = await params

  const profile = await getPartnerDetail(id)
  if (!profile || profile.role !== 'partner') notFound()

  const range = resolveRange('all')
  const [kpis, links, conversions, payouts, integrations, evaluation] = await Promise.all([
    getPartnerKpis(id, range),
    getPartnerLinksAdmin(id),
    getPartnerConversionsAdmin(id),
    getPartnerPayoutsAdmin(id),
    getPartnerIntegrationsAdmin(id),
    getPartnerEvaluation(id),
  ])

  const tierKey = normalizeTierKey(profile.society_tier)
  const ratePct = Math.round(profile.commission_rate * 100)
  const evalInput = evaluation
    ? {
        approved_content_count: evaluation.approved_content_count,
        compliance_score: evaluation.compliance_score,
        content_quality_score: evaluation.content_quality_score,
        responsiveness_score: evaluation.responsiveness_score,
        notes: evaluation.notes,
      }
    : null

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <Link
              href="/admin/parceiros"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#f6f6f6] hover:text-[#1d1d1b]"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1b] sm:text-xl">
                {profile.full_name ?? 'Parceiro'}
              </h1>
              <p className="mt-0.5 text-sm text-[#6B7280]">{profile.handle ? `@${profile.handle}` : '—'}</p>
            </div>
          </div>
          <PartnerActions
            partnerId={id}
            status={profile.status}
            societyTier={tierKey}
            followerCount={profile.follower_count}
            commissionRatePct={ratePct}
            evaluation={evalInput}
          />
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SocietyMark tier={tierKey} full size="md" />
          <Badge className={STATUS_STYLES[profile.status]}>{STATUS_LABEL[profile.status]}</Badge>
          <Badge className="bg-[#6B7280]/10 text-[#6B7280]">{ratePct}% de comissão</Badge>
          <Badge className="bg-[#6B7280]/10 text-[#6B7280]">{formatFollowers(profile.follower_count)} seguidores</Badge>
          <span className="text-sm text-[#6B7280]">
            Chave PIX: <span className="font-medium text-[#1d1d1b]">{profile.pix_key ?? '— não informada —'}</span>
          </span>
          <span className="text-sm text-[#6B7280]">Desde {formatDateLong(profile.created_at)}</span>
        </div>

        {integrations.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#6B7280]">Redes conectadas:</span>
            {integrations.map((i) => (
              <span
                key={i.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] px-2.5 py-1 text-xs text-[#1d1d1b]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PROVIDERS[i.provider]?.brand ?? '#9CA3AF' }}
                />
                {PROVIDERS[i.provider]?.label ?? i.provider} · {formatFollowers(i.follower_count)}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Kpi label="Cliques" value={formatNumber(kpis.cliques)} />
          <Kpi label="Leads" value={formatNumber(kpis.leads)} />
          <Kpi label="Conversões" value={formatNumber(kpis.conversoes)} />
          <Kpi label="Comissão total" value={formatCurrency(kpis.comissao)} highlight />
          <Kpi label="A receber" value={formatCurrency(kpis.a_receber)} />
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div>
            <p className="text-sm text-[#6B7280]">Saldo a repassar</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0FB5A6]">{formatCurrency(kpis.a_receber)}</p>
          </div>
          <MarkPaidButton partnerId={id} amount={Number(kpis.a_receber)} size="default" />
        </div>

        <Card className="mt-6 border-[#E5E5E5] bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1d1d1b]">Avaliação do parceiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <EvalStat label="Conteúdos aprovados" value={formatNumber(evaluation?.approved_content_count ?? 0)} />
              <EvalStat label="Conformidade" value={`${evaluation?.compliance_score ?? 0}/100`} />
              <EvalStat label="Qualidade" value={`${evaluation?.content_quality_score ?? 0}/100`} />
              <EvalStat label="Responsividade" value={`${evaluation?.responsiveness_score ?? 0}/100`} />
            </div>
            {evaluation?.notes && (
              <p className="mt-4 rounded-lg bg-[#F9FAFB] px-3 py-2 text-sm text-[#6B7280]">{evaluation.notes}</p>
            )}
            {!evaluation && (
              <p className="mt-4 text-sm text-[#9CA3AF]">
                Sem avaliação registrada. Use o menu de ações para registrar os critérios.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-[#1d1d1b]">Links</CardTitle>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#6B7280]">Nenhum link cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {links.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0FB5A6]/10">
                        <Link2 className="h-4 w-4 text-[#0FB5A6]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1d1d1b]">{l.label}</p>
                        <code className="text-xs text-[#6B7280]">tetra.link/{l.slug}</code>
                      </div>
                      <Badge className={l.status === 'active' ? 'bg-[#0FB5A6]/15 text-[#0E9F92]' : 'bg-[#6B7280]/10 text-[#6B7280]'}>
                        {l.status === 'active' ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-[#1d1d1b]">Histórico de repasses</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#6B7280]">Nenhum repasse ainda.</p>
              ) : (
                <div className="space-y-2">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-[#f6f6f6]">
                      <div>
                        <p className="font-medium text-[#1d1d1b]">{p.reference_period ?? '—'}</p>
                        <p className="text-xs text-[#6B7280]">
                          {p.paid_at ? formatDateLong(p.paid_at) : formatDateLong(p.created_at)} · {p.method}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-medium text-[#0FB5A6]">{formatCurrency(Number(p.amount))}</span>
                        <Badge className={p.status === 'pago' ? 'bg-[#0FB5A6]/15 text-[#0E9F92]' : 'bg-amber-500/15 text-amber-600'}>
                          {p.status === 'pago' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-[#E5E5E5] bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1d1d1b]">Conversões recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {conversions.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#6B7280]">Nenhuma conversão registrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E5E5E5]">
                      <TableHead className="text-xs font-medium text-[#6B7280]">Data</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Comprador</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Curso</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Valor</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Comissão</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversions.map((c) => (
                      <TableRow key={c.id} className="border-[#E5E5E5]">
                        <TableCell className="whitespace-nowrap text-sm text-[#6B7280]">{formatDateLong(c.created_at)}</TableCell>
                        <TableCell className="text-sm font-medium text-[#1d1d1b]">{c.buyer_masked}</TableCell>
                        <TableCell className="text-sm text-[#1d1d1b]">{c.course}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-[#1d1d1b]">{formatCurrency(Number(c.amount))}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums text-[#0FB5A6]">{formatCurrency(Number(c.commission))}</TableCell>
                        <TableCell>
                          <Badge className={CONV_STATUS_STYLES[c.status]}>{CONV_STATUS_LABEL[c.status]}</Badge>
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

function EvalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-[#1d1d1b]">{value}</p>
    </div>
  )
}

function Kpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${highlight ? 'text-[#0FB5A6]' : 'text-[#1d1d1b]'}`}>
        {value}
      </p>
    </div>
  )
}
