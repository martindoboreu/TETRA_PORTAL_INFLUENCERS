'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { createAsset, deleteAsset, type ContentActionState } from '@/app/admin/content-actions'
import type { AdminAsset } from '@/lib/queries/admin-content'
import type { AssetCategory } from '@/lib/database.types'

const INITIAL: ContentActionState = { ok: true, error: null }
const inputCls = 'h-9 border-line'
const labelCls = 'text-xs text-ink-muted'

const CATEGORY_LABEL: Record<AssetCategory, string> = {
  criativo: 'Criativo',
  legenda: 'Legenda',
  guia: 'Guia',
  exemplo: 'Exemplo',
}

export function AssetManager({ assets }: { assets: AdminAsset[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(assets.length === 0)
  const [createState, createAction, creating] = useActionState(createAsset, INITIAL)

  useEffect(() => {
    if (createState.ok && createState.error === null && !creating) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [createState, creating, router])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white shadow-[var(--elevation-card)]">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="text-base font-semibold text-ink">Materiais</h2>
          <Button
            size="sm"
            variant={open ? 'outline' : 'default'}
            className={open ? 'h-9 border-line' : 'h-9 bg-[#1d1d1b] text-white hover:bg-black'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Fechar' : (<><Plus className="h-4 w-4" /> Novo material</>)}
          </Button>
        </div>

        {open && (
          <form ref={formRef} action={createAction} className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelCls}>Título</label>
                <Input name="title" required className={inputCls} placeholder="Pack de imagens · Pós" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Categoria</label>
                <select name="category" defaultValue="criativo" className="h-9 w-full rounded-md border border-line px-2 text-sm">
                  <option value="criativo">Criativo</option>
                  <option value="legenda">Legenda</option>
                  <option value="guia">Guia</option>
                  <option value="exemplo">Exemplo</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Descrição</label>
              <Input name="description" className={inputCls} placeholder="Artes para feed e stories" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Legenda (para materiais do tipo legenda)</label>
              <textarea
                name="caption_text"
                rows={2}
                className="w-full rounded-md border border-line p-2 text-sm"
                placeholder="Texto pronto para o parceiro copiar."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className={labelCls}>Curso (opcional)</label>
                <Input name="course" className={inputCls} placeholder="Pós-Graduação" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Formato</label>
                <Input name="format" className={inputCls} placeholder="PDF, ZIP, Vídeo..." />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>URL do arquivo</label>
                <Input name="file_url" className={inputCls} placeholder="https://..." />
              </div>
            </div>
            <Button type="submit" disabled={creating} className="h-9 bg-[#1d1d1b] text-white hover:bg-black">
              {creating ? 'Criando...' : 'Adicionar material'}
            </Button>
            {createState.error && <p className="text-sm text-[#EF4444]">{createState.error}</p>}
          </form>
        )}
      </div>

      {assets.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white shadow-[var(--elevation-card)]">
          <EmptyState icon={FolderOpen} title="Nenhum material" description="Adicione criativos, legendas e guias para os parceiros." />
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((a) => (
            <AssetRow key={a.id} asset={a} categoryLabel={CATEGORY_LABEL[a.category]} />
          ))}
        </div>
      )}
    </div>
  )
}

function AssetRow({ asset, categoryLabel }: { asset: AdminAsset; categoryLabel: string }) {
  const router = useRouter()
  const [delState, delAction, delPending] = useActionState(deleteAsset, INITIAL)

  useEffect(() => {
    if (delState.ok && !delPending) router.refresh()
  }, [delState, delPending, router])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--elevation-card)]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-muted">
            {categoryLabel}
          </span>
          <p className="font-medium text-ink">{asset.title}</p>
        </div>
        {asset.description && <p className="mt-0.5 text-sm text-ink-muted">{asset.description}</p>}
      </div>
      <form action={delAction}>
        <input type="hidden" name="asset_id" value={asset.id} />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={delPending}
          aria-label="Remover material"
          className="h-9 w-9 text-ink-muted hover:text-[#EF4444]"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
