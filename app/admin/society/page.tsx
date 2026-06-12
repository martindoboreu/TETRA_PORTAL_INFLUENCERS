import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PartnerActions } from '@/components/admin/partner-actions'
import { SocietyMark } from '@/components/society/society-mark'
import {
  getPartnerRollup,
  getPartnerFollowerMap,
  getPartnerSocietyMap,
  getPartnerEvaluationsMap,
} from '@/lib/queries/admin'
import { resolveRange } from '@/lib/queries/range'
import { SOCIETY_TIERS } from '@/lib/society'
import { formatCurrency } from '@/lib/format'
import type { SocietyTierKey } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export default async function AdminSocietyPage() {
  const [rollup, followerMap, societyMap, evaluations] = await Promise.all([
    getPartnerRollup(resolveRange('all')),
    getPartnerFollowerMap(),
    getPartnerSocietyMap(),
    getPartnerEvaluationsMap(),
  ])

  const partners = rollup.filter((p) => p.status !== 'pendente')

  const byTier = new Map<SocietyTierKey, typeof partners>()
  for (const tier of SOCIETY_TIERS) byTier.set(tier.key, [])
  for (const p of partners) {
    const key = societyMap.get(p.partner_id) ?? 'select'
    byTier.get(key)?.push(p)
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1b] sm:text-xl">Tetra Society</h1>
            <p className="mt-0.5 hidden text-sm text-[#6B7280] sm:block">
              Parceiros por status · convites e histórico validado
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {SOCIETY_TIERS.map((tier) => {
          const members = byTier.get(tier.key) ?? []
          return (
            <Card key={tier.key} className="border-[#E5E5E5] bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-base font-semibold text-[#1d1d1b]">
                  <SocietyMark tier={tier.key} full />
                  <span className="text-sm font-normal text-[#6B7280]">
                    {members.length} {members.length === 1 ? 'parceiro' : 'parceiros'}
                    {tier.inviteOnly && ' · apenas por convite'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[#9CA3AF]">
                    Nenhum parceiro neste status — convites são estendidos manualmente pela equipe.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {members.map((p) => {
                      const ev = evaluations.get(p.partner_id)
                      return (
                        <div
                          key={p.partner_id}
                          className="flex flex-wrap items-center gap-4 rounded-xl border border-[#E5E5E5] p-3"
                        >
                          <Link
                            href={`/admin/parceiros/${p.partner_id}`}
                            className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
                          >
                            <Avatar className="h-9 w-9 border border-[#E5E5E5]">
                              <AvatarFallback className="bg-[#1d1d1b] text-xs text-[#f6f6f6]">
                                {p.avatar_initials ?? '–'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#1d1d1b]">{p.full_name ?? 'Parceiro'}</p>
                              <p className="truncate text-xs text-[#6B7280]">{p.handle ? `@${p.handle}` : '—'}</p>
                            </div>
                          </Link>

                          <div className="hidden text-right sm:block">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">Receita atribuída</p>
                            <p className="text-sm font-medium tabular-nums text-[#0FB5A6]">{formatCurrency(p.comissao)}</p>
                          </div>
                          <div className="hidden text-right md:block">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">Conteúdos · Conformidade</p>
                            <p className="text-sm tabular-nums text-[#1d1d1b]">
                              {ev?.approved_content_count ?? 0} · {ev?.compliance_score ?? 0}/100
                            </p>
                          </div>

                          <PartnerActions
                            partnerId={p.partner_id}
                            status={p.status}
                            societyTier={tier.key}
                            followerCount={followerMap.get(p.partner_id) ?? 0}
                            commissionRatePct={Math.round(p.commission_rate * 100)}
                            evaluation={
                              ev
                                ? {
                                    approved_content_count: ev.approved_content_count,
                                    compliance_score: ev.compliance_score,
                                    content_quality_score: ev.content_quality_score,
                                    responsiveness_score: ev.responsiveness_score,
                                    notes: ev.notes,
                                  }
                                : null
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
