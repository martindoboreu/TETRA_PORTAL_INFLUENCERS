import { Download, FileText, Image as ImageIcon, Sparkles, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CaptionCopy } from '@/components/materials/caption-copy'
import type { Asset } from '@/lib/queries/assets'
import type { AssetCategory } from '@/lib/database.types'

const CATEGORY_ICON: Record<AssetCategory, LucideIcon> = {
  criativo: ImageIcon,
  legenda: FileText,
  guia: Sparkles,
  exemplo: Video,
}

export function AssetCard({ asset }: { asset: Asset }) {
  const Icon = CATEGORY_ICON[asset.category]

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
          <Icon className="h-5 w-5 text-ink-muted" />
        </div>
        {asset.format && (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-muted">
            {asset.format}
          </span>
        )}
      </div>

      <p className="mt-4 font-medium text-ink">{asset.title}</p>
      {asset.course && <p className="mt-0.5 text-xs text-ink-subtle">{asset.course}</p>}
      {asset.description && <p className="mt-1 text-sm text-ink-muted">{asset.description}</p>}

      {asset.caption_text && <CaptionCopy text={asset.caption_text} />}

      <div className="mt-4 flex-1" />

      {asset.file_url ? (
        <a
          href={asset.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          <Download className="h-4 w-4" />
          Baixar material
        </a>
      ) : asset.caption_text ? null : (
        <span className="inline-flex items-center justify-center rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-muted">
          Disponível em breve
        </span>
      )}
    </div>
  )
}
