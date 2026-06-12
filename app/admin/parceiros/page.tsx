import Link from 'next/link'
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
import { PartnerFilters } from '@/components/admin/partner-filters'
import { PartnerActions } from '@/components/admin/partner-actions'
import { SocietyMark } from '@/components/society/society-mark'
import { getPartnerRollup, getPartnerFollowerMap, getPartnerSocietyMap } from '@/lib/queries/admin'
import { resolveRange } from '@/lib/queries/range'
import { formatCurrency, formatNumber, formatFollowers } from '@/lib/format'
import { SOCIETY_TIERS } from '@/lib/society'

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

type StatusFilter = 'todos' | 'ativo' | 'pendente' | 'inativo'

interface ParceirosPageProps {
  searchParams: Promise<{ q?: string; status?: string; level?: string }>
}

export default async function ParceirosPage({ searchParams }: ParceirosPageProps) {
  const { q, status, level } = await searchParams

  const statusFilter: StatusFilter =
    status === 'ativo' || status === 'pendente' || status === 'inativo' ? status : 'todos'
  const levelFilter = level && level !== 'todos' ? level : 'todos'
  const search = (q ?? '').trim().toLowerCase()

  // Use "tudo" range so the roster shows lifetime cliques/conversões/comissão.
  const [rollup, followerMap, societyMap] = await Promise.all([
    getPartnerRollup(resolveRange('all')),
    getPartnerFollowerMap(),
    getPartnerSocietyMap(),
  ])

  const filtered = rollup.filter((p) => {
    if (statusFilter !== 'todos' && p.status !== statusFilter) return false
    if (levelFilter !== 'todos' && p.tier !== levelFilter) return false
    if (search) {
      const hay = `${p.full_name ?? ''} ${p.handle ?? ''}`.toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1b] sm:text-xl">Parceiros</h1>
            <p className="mt-0.5 hidden text-sm text-[#6B7280] sm:block">
              Gerencie o cadastro, o status na Tetra Society e os convites
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-base font-semibold text-[#1d1d1b]">
                {filtered.length} {filtered.length === 1 ? 'parceiro' : 'parceiros'}
              </CardTitle>
              <PartnerFilters
                initialSearch={q ?? ''}
                initialStatus={statusFilter}
                initialLevel={levelFilter}
                levels={SOCIETY_TIERS.map((t) => t.name)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6B7280]">Nenhum parceiro para esses filtros.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E5E5E5]">
                      <TableHead className="text-xs font-medium text-[#6B7280]">Parceiro</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Handle</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Status</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Alcance</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Status</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Cliques</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Conversões</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Comissão</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.partner_id} className="border-[#E5E5E5]">
                        <TableCell>
                          <Link href={`/admin/parceiros/${p.partner_id}`} className="flex items-center gap-3 hover:underline">
                            <Avatar className="h-9 w-9 border border-[#E5E5E5]">
                              <AvatarFallback className="bg-[#1d1d1b] text-xs text-[#f6f6f6]">
                                {p.avatar_initials ?? '–'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-[#1d1d1b]">{p.full_name ?? 'Parceiro'}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">{p.handle ? `@${p.handle}` : '—'}</TableCell>
                        <TableCell>
                          <SocietyMark tier={societyMap.get(p.partner_id) ?? 'select'} full />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-[#6B7280]">
                          {formatFollowers(followerMap.get(p.partner_id) ?? 0)}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_STYLES[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-[#1d1d1b]">{formatNumber(p.cliques)}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-[#1d1d1b]">{formatNumber(p.conversoes)}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums text-[#0FB5A6]">{formatCurrency(p.comissao)}</TableCell>
                        <TableCell className="text-right">
                          <PartnerActions
                            partnerId={p.partner_id}
                            status={p.status}
                            societyTier={societyMap.get(p.partner_id) ?? 'select'}
                            followerCount={followerMap.get(p.partner_id) ?? 0}
                            commissionRatePct={Math.round(p.commission_rate * 100)}
                          />
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
