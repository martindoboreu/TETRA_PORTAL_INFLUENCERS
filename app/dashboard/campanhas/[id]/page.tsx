import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, FileText, Gift, ListChecks, Percent } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { AcceptCampaignButton } from '@/components/campaigns/accept-campaign-button'
import { getPartnerCampaign } from '@/lib/queries/campaigns'
import { requireUser } from '@/lib/queries/partner'
import { formatDateLong } from '@/lib/format'

export const dynamic = 'force-dynamic'

interface CampaignDetailProps {
  params: Promise<{ id: string }>
}

export default async function CampanhaDetailPage({ params }: CampaignDetailProps) {
  const { id } = await params
  const user = await requireUser()
  const campaign = await getPartnerCampaign(id, user.id)

  if (!campaign) notFound()

  return (
    <>
      <PageHeader title={campaign.title} subtitle={campaign.subtitle ?? undefined} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/campanhas"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para campanhas
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            {campaign.deadline && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" />
                Prazo: {formatDateLong(campaign.deadline)}
              </span>
            )}
            {campaign.participation_status && (
              <StatusBadge status={campaign.participation_status} />
            )}
          </div>
          <AcceptCampaignButton campaignId={campaign.id} status={campaign.participation_status} />
        </div>

        {campaign.brief && (
          <Section icon={FileText} title="Briefing">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{campaign.brief}</p>
          </Section>
        )}

        {campaign.commission_note && (
          <Section icon={Percent} title="Comissão">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{campaign.commission_note}</p>
          </Section>
        )}

        {campaign.content_requirements && (
          <Section icon={ListChecks} title="Requisitos de conteúdo">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {campaign.content_requirements}
            </p>
          </Section>
        )}

        {campaign.reward_highlight && (
          <Section icon={Gift} title="Bônus">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{campaign.reward_highlight}</p>
          </Section>
        )}
      </div>
    </>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)]">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted">
          <Icon className="h-4 w-4 text-ink-muted" />
        </div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}
