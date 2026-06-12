import { PageHeader } from '@/components/page-header'
import { AssetManager } from '@/components/admin/asset-manager'
import { getAdminAssets } from '@/lib/queries/admin-content'

export const dynamic = 'force-dynamic'

export default async function AdminMateriaisPage() {
  const assets = await getAdminAssets()

  return (
    <>
      <PageHeader
        title="Materiais"
        subtitle="Curadoria de criativos, legendas e guias para os parceiros"
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <AssetManager assets={assets} />
      </div>
    </>
  )
}
