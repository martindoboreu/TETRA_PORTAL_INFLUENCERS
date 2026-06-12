import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SocietyStatusCard } from '@/components/society/status-card'
import { InvitationCriteria, CouncilCard } from '@/components/society/invitation-criteria'
import { BenefitsMatrix } from '@/components/society/benefits-matrix'
import { getPartnerSociety, getSocietyTiers } from '@/lib/queries/society'
import { nextTier } from '@/lib/society'
import { requireUser } from '@/lib/queries/partner'

export const dynamic = 'force-dynamic'

export default async function SocietyPage() {
  const user = await requireUser()
  const [society, tiers] = await Promise.all([
    getPartnerSociety(user.id),
    getSocietyTiers(),
  ])

  const upcoming = nextTier(society.tier)

  return (
    <>
      <PageHeader
        title="Tetra Society"
        subtitle="Seu status, critérios para convite e benefícios"
        actions={<NotificationBell />}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <SocietyStatusCard
          tier={society.tier}
          commissionRate={society.commissionRate}
          sinceDate={society.sinceDate}
        />

        {/* Next-invitation surface: criteria for the next non-council tier. */}
        {upcoming && !upcoming.inviteOnly && (
          <InvitationCriteria nextTier={upcoming} criteria={society.criteria} />
        )}

        {/* Council is always shown as invite-only aspiration (unless already there). */}
        {society.tier !== 'council' && <CouncilCard />}

        <BenefitsMatrix
          currentTier={society.tier}
          tiers={tiers.map((t) => ({ key: t.key, commission_rate: t.commission_rate }))}
        />
      </div>
    </>
  )
}
