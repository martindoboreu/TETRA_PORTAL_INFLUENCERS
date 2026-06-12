import { Calendar } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { EarningsHero } from '@/components/earnings-hero'
import { SocietyStatusStrip } from '@/components/society/status-strip'
import { NextActions } from '@/components/next-actions'
import { ReferralCard } from '@/components/referral-card'
import { KPICards } from '@/components/kpi-cards'
import { PerformanceChart } from '@/components/performance-chart'
import { FunnelCard } from '@/components/funnel-card'
import { LinkPerformanceTable } from '@/components/link-performance-table'
import { RecentConversions } from '@/components/recent-conversions'
import { PayoutCard } from '@/components/payout-card'
import { DateRangeSelector } from '@/components/date-range-selector'
import {
  getPartnerChart,
  getPartnerFunnel,
  getPartnerIntegrations,
  getPartnerKpis,
  getPartnerLinkPerformance,
  getPartnerLinks,
  getPartnerPayouts,
  getPartnerProfile,
  getPartnerRecentConversions,
  getProgramSettings,
  requireUser,
} from '@/lib/queries/partner'
import { parseDateRange, resolveRange } from '@/lib/queries/range'
import { formatDateShort } from '@/lib/format'
import { referralDisplay } from '@/lib/links'
import { normalizeTierKey } from '@/lib/society'

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { range: rangeParam } = await searchParams
  const range = resolveRange(parseDateRange(rangeParam))
  const user = await requireUser()

  const [kpis, chart, funnel, linkPerf, recent, links, payouts, settings, profile, integrations] =
    await Promise.all([
      getPartnerKpis(user.id, range),
      getPartnerChart(user.id, range),
      getPartnerFunnel(user.id, range),
      getPartnerLinkPerformance(user.id, range),
      getPartnerRecentConversions(user.id),
      getPartnerLinks(user.id),
      getPartnerPayouts(user.id),
      getProgramSettings(),
      getPartnerProfile(user.id),
      getPartnerIntegrations(user.id),
    ])

  const primary = links[0]
  const primaryLink = primary ? referralDisplay(primary.slug) : null
  const primaryCode = primary?.discount_code ?? null

  // Partner's own influence-derived rate, with the program default as a fallback.
  const rawRate = profile?.commission_rate ?? settings?.default_commission_rate ?? 0.3
  const commissionRatePct = Math.round(rawRate * 100)
  const nextPayoutLabel = settings?.next_payout_date
    ? formatDateShort(settings.next_payout_date)
    : 'a definir'

  const activeLinks = links.filter((l) => l.status === 'active')
  const connectedSocials = integrations.filter((i) => i.status === 'connected')

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle="Seu desempenho como parceiro Tetra"
        actions={
          <>
            <div className="hidden sm:block">
              <DateRangeSelector value={range.range} />
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-sm text-ink-muted md:flex">
              <Calendar className="h-4 w-4" />
              <span>Próximo repasse · {nextPayoutLabel}</span>
            </div>
            <NotificationBell />
          </>
        }
        mobileActions={<DateRangeSelector value={range.range} />}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <EarningsHero
          periodCommission={kpis.comissao}
          periodCommissionDelta={kpis.comissao_delta}
          pendingCommission={kpis.a_receber}
          nextPayoutLabel={nextPayoutLabel}
          commissionRatePct={commissionRatePct}
          rangeLabel={range.label}
        />

        <SocietyStatusStrip tier={normalizeTierKey(profile?.society_tier)} />

        <NextActions
          pixKeyMissing={!profile?.pix_key}
          noActiveLink={activeLinks.length === 0}
          noSocialConnected={connectedSocials.length === 0}
        />

        <ReferralCard
          primaryLink={primaryLink}
          primaryCode={primaryCode}
          commissionRatePct={commissionRatePct}
        />

        <KPICards data={kpis} nextPayoutLabel={nextPayoutLabel} />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <PerformanceChart data={chart} />
          </div>
          <FunnelCard data={funnel} />
        </div>

        <LinkPerformanceTable data={linkPerf} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentConversions data={recent} />
          <PayoutCard
            aReceber={kpis.a_receber}
            nextPayoutDate={settings?.next_payout_date ?? null}
            history={payouts}
          />
        </div>
      </div>
    </>
  )
}
