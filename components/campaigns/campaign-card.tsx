import Link from 'next/link'
import { ArrowRight, CalendarClock, Gift } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatDateLong } from '@/lib/format'
import type { PartnerCampaign } from '@/lib/queries/campaigns'

export function CampaignCard({ campaign }: { campaign: PartnerCampaign }) {
  return (
    <Link
      href={`/dashboard/campanhas/${campaign.id}`}
      className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)] transition-all hover:border-brand/40 hover:shadow-[var(--elevation-card-hover)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{campaign.title}</h3>
          {campaign.subtitle && <p className="mt-0.5 text-sm text-ink-muted">{campaign.subtitle}</p>}
        </div>
        {campaign.participation_status ? (
          <StatusBadge status={campaign.participation_status} />
        ) : (
          <StatusBadge status="ativa" label="Disponível" />
        )}
      </div>

      {campaign.brief && (
        <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{campaign.brief}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
        {campaign.deadline && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Até {formatDateLong(campaign.deadline)}
          </span>
        )}
        {campaign.reward_highlight && (
          <span className="inline-flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            Bônus disponível
          </span>
        )}
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
        Ver briefing
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
