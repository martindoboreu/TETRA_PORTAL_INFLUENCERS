import { Link2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { StatusBadge } from '@/components/status-badge'
import { StatCard } from '@/components/stat-card'
import { EmptyState } from '@/components/empty-state'
import { CopyButton } from '@/components/copy-button'
import { NewLinkButton } from '@/components/new-link-button'
import { LinkActions } from '@/components/link-actions'
import { DateRangeSelector } from '@/components/date-range-selector'
import {
  getPartnerLinkPerformance,
  getPartnerLinks,
  requireUser,
} from '@/lib/queries/partner'
import { parseDateRange, resolveRange } from '@/lib/queries/range'
import { formatCurrency, formatDateLong, formatNumber } from '@/lib/format'
import { referralUrl, referralDisplay } from '@/lib/links'

export const dynamic = 'force-dynamic'

interface LinksPageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function LinksPage({ searchParams }: LinksPageProps) {
  const { range: rangeParam } = await searchParams
  const range = resolveRange(parseDateRange(rangeParam))
  const user = await requireUser()

  const [links, perf] = await Promise.all([
    getPartnerLinks(user.id),
    getPartnerLinkPerformance(user.id, range),
  ])

  const perfByLink = new Map(perf.map((p) => [p.link_id, p]))
  const totalCliques = perf.reduce((acc, p) => acc + Number(p.cliques ?? 0), 0)
  const totalComissao = perf.reduce((acc, p) => acc + Number(p.comissao ?? 0), 0)
  const activeCount = links.filter((l) => l.status === 'active').length

  return (
    <>
      <PageHeader
        title="Links e Cupons"
        subtitle="Gerencie seus links rastreáveis e cupons de indicação"
        actions={
          <>
            <div className="hidden sm:block">
              <DateRangeSelector value={range.range} />
            </div>
            <NewLinkButton />
            <NotificationBell />
          </>
        }
        mobileActions={<DateRangeSelector value={range.range} />}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total de links" value={formatNumber(links.length)} />
          <StatCard label="Links ativos" value={formatNumber(activeCount)} highlight />
          <StatCard label="Cliques no período" value={formatNumber(totalCliques)} />
          <StatCard label="Comissão no período" value={formatCurrency(totalComissao)} />
        </div>

        <Card className="border-line bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-ink">
              Seus links de indicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="Você ainda não tem links"
                description="Crie seu primeiro link rastreável para começar a divulgar a Tetra e acompanhar resultados."
                action={<NewLinkButton />}
              />
            ) : (
              <div className="space-y-4">
                {links.map((link) => {
                  const stats = perfByLink.get(link.id)
                  const shortUrl = referralDisplay(link.slug)
                  const fullUrl = referralUrl(link.slug)
                  return (
                    <div
                      key={link.id}
                      className="flex flex-col gap-4 rounded-xl border border-line p-4 transition-colors hover:bg-surface-muted/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                          <Link2 className="h-5 w-5 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-ink">{link.label}</p>
                            <StatusBadge status={link.status} />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <code className="rounded bg-surface-muted px-2 py-0.5 text-sm text-ink-muted">
                              {shortUrl}
                            </code>
                            <CopyButton text={fullUrl} />
                            {link.discount_code && (
                              <span className="ml-1 inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">
                                Cupom: <code className="font-mono text-ink">{link.discount_code}</code>
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-ink-subtle">Criado em {formatDateLong(link.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 sm:justify-end">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-semibold tabular-nums text-ink">
                              {formatNumber(stats?.cliques ?? 0)}
                            </p>
                            <p className="text-xs text-ink-muted">Cliques</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold tabular-nums text-ink">
                              {formatNumber(stats?.conversoes ?? 0)}
                            </p>
                            <p className="text-xs text-ink-muted">Conversões</p>
                          </div>
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                            aria-label="Abrir link em nova aba"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <LinkActions linkId={link.id} status={link.status} label={link.label} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
