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
import { CopyButton } from '@/components/copy-button'
import { Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { referralUrl } from '@/lib/links'
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
  /** link_id -> 'active' | 'paused', sourced from the partner's links. */
  statusById?: Record<string, string>
}

// Source type is inferred from the label so the table reads like a media plan,
// not a list of slugs. No schema change required.
const SOURCE_RULES: [RegExp, string][] = [
  [/reel/i, 'Reel'],
  [/story|stories/i, 'Story'],
  [/bio|instagram|insta\b|@/i, 'Bio'],
  [/youtube|yt\b|v[íi]deo/i, 'YouTube'],
  [/whats|wpp|zap|grupo/i, 'WhatsApp'],
  [/newsletter|news\b/i, 'Newsletter'],
  [/landing|lp\b|p[áa]gina/i, 'Landing page'],
  [/tiktok/i, 'TikTok'],
  [/linkedin/i, 'LinkedIn'],
  [/podcast/i, 'Podcast'],
  [/blog/i, 'Blog'],
  [/e-?mail|assinatura/i, 'E-mail'],
  [/campanha/i, 'Campanha'],
]

function sourceType(label: string): string {
  for (const [pattern, type] of SOURCE_RULES) {
    if (pattern.test(label)) return type
  }
  return 'Link'
}

type RowTag = 'melhor' | 'teste' | 'sem-trafego' | 'pausado' | null

const TAG_META: Record<Exclude<RowTag, null>, { label: string; className: string }> = {
  melhor: { label: 'Melhor canal', className: 'border-[#0FB5A6]/30 bg-[#0FB5A6]/10 text-[#0E7C73]' },
  teste: { label: 'Em teste', className: 'border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#B45309]' },
  'sem-trafego': { label: 'Sem tráfego', className: 'border-line bg-surface-muted text-ink-subtle' },
  pausado: { label: 'Pausado', className: 'border-line bg-surface-muted text-ink-muted' },
}

export function LinkPerformanceTable({ data, statusById = {} }: LinkPerformanceTableProps) {
  // Active rows ranked by commission, then conversões; dormant rows sink to the
  // bottom in a muted style so junk can never masquerade as a real channel.
  const ranked = [...data].sort(
    (a, b) => b.comissao - a.comissao || b.conversoes - a.conversoes || b.cliques - a.cliques
  )
  const withTraffic = ranked.filter((r) => r.cliques > 0)
  const dormant = ranked.filter((r) => r.cliques === 0)
  const best = withTraffic.find((r) => r.conversoes > 0) ?? null

  const tagFor = (row: LinkPerformanceRow): RowTag => {
    if (statusById[row.link_id] === 'paused') return 'pausado'
    if (row.cliques === 0) return 'sem-trafego'
    if (best && row.link_id === best.link_id && withTraffic.length > 1) return 'melhor'
    if (row.conversoes === 0) return 'teste'
    return null
  }

  return (
    <div className="animate-fade-slide-up overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--elevation-card)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 p-6 pb-4">
        <div>
          <h3 className="text-base font-semibold text-ink">Desempenho por link</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Cada origem com cliques, leads e matrículas no período
          </p>
        </div>
        {withTraffic.length > 0 && (
          <span className="text-xs tabular-nums text-ink-subtle">
            {withTraffic.length} {withTraffic.length === 1 ? 'origem ativa' : 'origens ativas'}
          </span>
        )}
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="min-w-[220px] pl-6 text-micro">Origem</TableHead>
                <TableHead className="text-right text-micro">Cliques</TableHead>
                <TableHead className="text-right text-micro">Leads</TableHead>
                <TableHead className="text-right text-micro">Matrículas</TableHead>
                <TableHead className="text-right text-micro">Conv. %</TableHead>
                <TableHead className="text-right text-micro">Comissão</TableHead>
                <TableHead className="w-12 pr-4 text-right text-micro">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...withTraffic, ...dormant].map((row) => {
                const tag = tagFor(row)
                const muted = tag === 'sem-trafego' || tag === 'pausado'
                return (
                  <TableRow
                    key={row.link_id}
                    className={cn(
                      'border-line transition-colors hover:bg-surface-muted',
                      muted && 'bg-surface-muted/40'
                    )}
                  >
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex shrink-0 rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-ink-muted">
                          {sourceType(row.label)}
                        </span>
                        <span
                          className={cn(
                            'truncate text-sm font-medium',
                            muted ? 'text-ink-muted' : 'text-ink'
                          )}
                        >
                          {row.label}
                        </span>
                        {tag && (
                          <span
                            className={cn(
                              'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                              TAG_META[tag].className
                            )}
                          >
                            {TAG_META[tag].label}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <NumCell value={formatNumber(row.cliques)} muted={muted} />
                    <NumCell value={formatNumber(row.leads)} muted={muted} />
                    <NumCell value={formatNumber(row.conversoes)} muted={muted} />
                    <NumCell
                      value={row.cliques > 0 ? formatPercentage(row.taxa_conversao) : '—'}
                      muted={muted}
                    />
                    <TableCell
                      className={cn(
                        'py-3 text-right text-sm font-medium tabular-nums',
                        muted ? 'text-ink-subtle' : row.comissao > 0 ? 'text-brand-deep' : 'text-ink'
                      )}
                    >
                      {row.comissao > 0 || !muted ? formatCurrency(row.comissao) : '—'}
                    </TableCell>
                    <TableCell className="py-2 pr-4 text-right">
                      <CopyButton text={referralUrl(row.slug)} label={`Copiar link de ${row.label}`} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function NumCell({ value, muted }: { value: string; muted: boolean }) {
  return (
    <TableCell
      className={cn('py-3 text-right text-sm tabular-nums', muted ? 'text-ink-subtle' : 'text-ink')}
    >
      {value}
    </TableCell>
  )
}
