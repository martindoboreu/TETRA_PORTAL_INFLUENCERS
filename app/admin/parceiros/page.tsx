import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
import { StatusBadge } from '@/components/status-badge'
import { getPartnerRollup, getPartnerFollowerMap, getPartnerSocietyMap } from '@/lib/queries/admin'
import { resolveRange } from '@/lib/queries/range'
import { formatCurrency, formatNumber, formatFollowers } from '@/lib/format'
import { SOCIETY_TIERS, isSocietyTierKey } from '@/lib/society'

export const dynamic = 'force-dynamic'

type StatusFilter = 'todos' | 'ativo' | 'pendente' | 'inativo'

interface ParceirosPageProps {
  searchParams: Promise<{ q?: string; status?: string; level?: string }>
}

export default async function ParceirosPage({ searchParams }: ParceirosPageProps) {
  const { q, status, level } = await searchParams

  const statusFilter: StatusFilter =
    status === 'ativo' || status === 'pendente' || status === 'inativo' ? status : 'todos'
  const levelFilter = isSocietyTierKey(level) ? level : 'todos'
  const search = (q ?? '').trim().toLowerCase()

  // Use "tudo" range so the roster shows lifetime cliques/conversões/comissão.
  const [rollup, followerMap, societyMap] = await Promise.all([
    getPartnerRollup(resolveRange('all')),
    getPartnerFollowerMap(),
    getPartnerSocietyMap(),
  ])

  const filtered = rollup.filter((p) => {
    if (statusFilter !== 'todos' && p.status !== statusFilter) return false
    if (levelFilter !== 'todos' && (societyMap.get(p.partner_id) ?? 'select') !== levelFilter)
      return false
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
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 pb-5">
              <PartnerFilters
                initialSearch={q ?? ''}
                initialStatus={statusFilter}
                initialLevel={levelFilter}
                levels={SOCIETY_TIERS.map((t) => ({ value: t.key, label: t.name }))}
              />
              <p className="text-sm text-[#6B7280]">
                <span className="font-semibold tabular-nums text-[#1d1d1b]">{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'parceiro' : 'parceiros'}
                {(statusFilter !== 'todos' || levelFilter !== 'todos' || search) && ' com esses filtros'}
              </p>
            </div>

            <div className="overflow-x-auto">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#6B7280]">
                  Nenhum parceiro para esses filtros.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E5E5E5] hover:bg-transparent">
                      <TableHead className="min-w-[200px] text-xs font-medium text-[#6B7280]">Parceiro</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Handle</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Society</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Conta</TableHead>
                      <TableHead className="hidden text-right text-xs font-medium text-[#6B7280] lg:table-cell">Alcance</TableHead>
                      <TableHead className="hidden text-right text-xs font-medium text-[#6B7280] md:table-cell">Cliques</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Conversões</TableHead>
                      <TableHead className="text-right text-xs font-medium text-[#6B7280]">Comissão</TableHead>
                      <TableHead className="w-24 text-right text-xs font-medium text-[#6B7280]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.partner_id} className="border-[#E5E5E5]">
                        <TableCell className="py-3">
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
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="hidden text-right text-sm tabular-nums text-[#6B7280] lg:table-cell">
                          {formatFollowers(followerMap.get(p.partner_id) ?? 0)}
                        </TableCell>
                        <TableCell className="hidden text-right text-sm tabular-nums text-[#1d1d1b] md:table-cell">
                          {formatNumber(p.cliques)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-[#1d1d1b]">{formatNumber(p.conversoes)}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums text-[#0E7C73]">{formatCurrency(p.comissao)}</TableCell>
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
