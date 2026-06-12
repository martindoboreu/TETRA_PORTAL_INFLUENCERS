'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  deleteLink,
  toggleLinkStatus,
  type LinkActionState,
} from '@/app/dashboard/links/actions'

const INITIAL: LinkActionState = { ok: false, error: null }

interface LinkActionsProps {
  linkId: string
  status: 'active' | 'paused'
  label: string
}

export function LinkActions({ linkId, status, label }: LinkActionsProps) {
  const router = useRouter()
  const [toggleState, toggleAction, togglePending] = useActionState(toggleLinkStatus, INITIAL)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteLink, INITIAL)

  useEffect(() => {
    if (toggleState.ok || deleteState.ok) router.refresh()
  }, [toggleState, deleteState, router])

  const nextStatus = status === 'active' ? 'paused' : 'active'

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-1">
        <form action={toggleAction}>
          <input type="hidden" name="link_id" value={linkId} />
          <input type="hidden" name="status" value={nextStatus} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={togglePending || deletePending}
            className="h-8 border-[#E5E5E5] text-[#6B7280]"
          >
            {status === 'active' ? (
              <>
                <Pause className="mr-1 h-3.5 w-3.5" />
                Pausar
              </>
            ) : (
              <>
                <Play className="mr-1 h-3.5 w-3.5" />
                Ativar
              </>
            )}
          </Button>
        </form>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm(`Excluir o link "${label}"? Esta ação não pode ser desfeita.`)) {
              e.preventDefault()
            }
          }}
        >
          <input type="hidden" name="link_id" value={linkId} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={togglePending || deletePending}
            className="h-8 border-[#E5E5E5] text-[#6B7280] hover:border-[#EF4444]/40 hover:text-[#EF4444]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
      {(toggleState.error || deleteState.error) && (
        <p className="max-w-[200px] text-right text-xs text-[#EF4444]">
          {toggleState.error ?? deleteState.error}
        </p>
      )}
    </div>
  )
}
