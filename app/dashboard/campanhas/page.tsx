import { Megaphone } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { EmptyState } from '@/components/empty-state'
import { CampaignCard } from '@/components/campaigns/campaign-card'
import { getPartnerCampaigns } from '@/lib/queries/campaigns'
import { requireUser } from '@/lib/queries/partner'

export const dynamic = 'force-dynamic'

export default async function CampanhasPage() {
  const user = await requireUser()
  const campaigns = await getPartnerCampaigns(user.id)

  return (
    <>
      <PageHeader
        title="Campanhas"
        subtitle="Briefings ativos, regras de comissão e prazos para você divulgar"
        actions={<NotificationBell />}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white shadow-[var(--elevation-card)]">
            <EmptyState
              icon={Megaphone}
              title="Nenhuma campanha ativa no momento"
              description="Assim que a Tetra lançar uma nova campanha, o briefing aparece aqui com prazos e comissão."
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
