import { FolderOpen } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { EmptyState } from '@/components/empty-state'
import { AssetCard } from '@/components/materials/asset-card'
import { getAssets } from '@/lib/queries/assets'
import type { AssetCategory } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

const SECTIONS: { category: AssetCategory; title: string; description: string }[] = [
  { category: 'criativo', title: 'Criativos', description: 'Imagens e artes prontas para suas redes' },
  { category: 'legenda', title: 'Legendas sugeridas', description: 'Textos aprovados para copiar e adaptar' },
  { category: 'guia', title: 'Guias e marca', description: 'Diretrizes de marca e boas práticas' },
  { category: 'exemplo', title: 'Exemplos de posts', description: 'Referências de conteúdo que converte' },
]

export default async function MateriaisPage() {
  const assets = await getAssets()

  return (
    <>
      <PageHeader
        title="Materiais"
        subtitle="Criativos, legendas e guias para divulgar a Tetra"
        actions={<NotificationBell />}
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {assets.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white shadow-[var(--elevation-card)]">
            <EmptyState
              icon={FolderOpen}
              title="Materiais a caminho"
              description="A Tetra está preparando criativos e guias para você. Volte em breve."
            />
          </div>
        ) : (
          SECTIONS.map((section) => {
            const items = assets.filter((a) => a.category === section.category)
            if (items.length === 0) return null
            return (
              <section key={section.category}>
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                  <p className="text-sm text-ink-muted">{section.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((a) => (
                    <AssetCard key={a.id} asset={a} />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
    </>
  )
}
