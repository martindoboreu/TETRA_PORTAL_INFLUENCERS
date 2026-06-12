'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { Megaphone } from 'lucide-react'
import {
  createCampaign,
  setCampaignStatus,
  deleteCampaign,
  type ContentActionState,
} from '@/app/admin/content-actions'
import { formatDateLong } from '@/lib/format'
import type { AdminCampaign } from '@/lib/queries/admin-content'
import type { CampaignStatus } from '@/lib/database.types'

const INITIAL: ContentActionState = { ok: true, error: null }
const inputCls = 'h-9 border-line'
const labelCls = 'text-xs text-ink-muted'

export function CampaignManager({ campaigns }: { campaigns: AdminCampaign[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(campaigns.length === 0)
  const [createState, createAction, creating] = useActionState(createCampaign, INITIAL)

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
          <h2 className="text-base font-semibold text-ink">Campanhas</h2>
          <Button
            size="sm"
            variant={open ? 'outline' : 'default'}
            className={open ? 'h-9 border-line' : 'h-9 bg-[#1d1d1b] text-white hover:bg-black'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Fechar' : (<><Plus className="h-4 w-4" /> Nova campanha</>)}
          </Button>
        </div>

        {open && (
          <form ref={formRef} action={createAction} className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelCls}>Título</label>
                <Input name="title" required className={inputCls} placeholder="Matrículas 2026 · Pós" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Subtítulo</label>
                <Input name="subtitle" className={inputCls} placeholder="Campanha de captação" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Briefing</label>
              <textarea
                name="brief"
                rows={3}
                className="w-full rounded-md border border-line p-2 text-sm"
                placeholder="O que o parceiro deve divulgar e para quem."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelCls}>Comissão</label>
                <Input name="commission_note" className={inputCls} placeholder="Comissão do nível + cupom" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Bônus</label>
                <Input name="reward_highlight" className={inputCls} placeholder="Bônus de R$ 500 a partir de 10 matrículas" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Requisitos de conteúdo</label>
              <textarea
                name="content_requirements"
                rows={2}
                className="w-full rounded-md border border-line p-2 text-sm"
                placeholder="Mínimo de 2 stories + 1 post. Use a hashtag #TetraPós."
              />
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Prazo</label>
                <Input name="deadline" type="date" className={`${inputCls} w-44`} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Status</label>
                <select name="status" defaultValue="ativa" className="h-9 rounded-md border border-line px-2 text-sm">
                  <option value="rascunho">Rascunho</option>
                  <option value="ativa">Ativa</option>
                  <option value="encerrada">Encerrada</option>
                </select>
              </div>
              <Button type="submit" disabled={creating} className="h-9 bg-[#1d1d1b] text-white hover:bg-black">
                {creating ? 'Criando...' : 'Criar campanha'}
              </Button>
            </div>
            {createState.error && <p className="text-sm text-[#EF4444]">{createState.error}</p>}
          </form>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white shadow-[var(--elevation-card)]">
          <EmptyState
            icon={Megaphone}
            title="Nenhuma campanha criada"
            description="Crie a primeira campanha para que os parceiros recebam o briefing."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignRow key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignRow({ campaign }: { campaign: AdminCampaign }) {
  const router = useRouter()
  const [statusState, statusAction, statusPending] = useActionState(setCampaignStatus, INITIAL)
  const [delState, delAction, delPending] = useActionState(deleteCampaign, INITIAL)

  useEffect(() => {
    if ((statusState.ok && !statusPending) || (delState.ok && !delPending)) router.refresh()
  }, [statusState, statusPending, delState, delPending, router])

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-[var(--elevation-card)]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-ink">{campaign.title}</p>
          <StatusBadge status={campaign.status} />
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">
          {campaign.accepted_count} de {campaign.participant_count} parceiros participando
          {campaign.deadline ? ` · prazo ${formatDateLong(campaign.deadline)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <form action={statusAction}>
          <input type="hidden" name="campaign_id" value={campaign.id} />
          <select
            name="status"
            defaultValue={campaign.status}
            className="h-9 rounded-md border border-line px-2 text-sm"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            disabled={statusPending}
          >
            {(['rascunho', 'ativa', 'encerrada'] as CampaignStatus[]).map((s) => (
              <option key={s} value={s}>
                {s === 'rascunho' ? 'Rascunho' : s === 'ativa' ? 'Ativa' : 'Encerrada'}
              </option>
            ))}
          </select>
        </form>
        <form action={delAction}>
          <input type="hidden" name="campaign_id" value={campaign.id} />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={delPending}
            aria-label="Remover campanha"
            className="h-9 w-9 text-ink-muted hover:text-[#EF4444]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
