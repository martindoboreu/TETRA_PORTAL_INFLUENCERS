import { PageHeader } from '@/components/page-header'
import { CampaignManager } from '@/components/admin/campaign-manager'
import { getAdminCampaigns } from '@/lib/queries/admin-content'

export const dynamic = 'force-dynamic'

export default async function AdminCampanhasPage() {
  const campaigns = await getAdminCampaigns()

  return (
    <>
      <PageHeader
        title="Campanhas"
        subtitle="Crie e gerencie os briefings que os parceiros podem promover"
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <CampaignManager campaigns={campaigns} />
      </div>
    </>
  )
}
