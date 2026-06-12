'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptCampaign, type CampaignActionState } from '@/app/dashboard/campanhas/actions'
import type { CampaignParticipantStatus } from '@/lib/database.types'

const INITIAL: CampaignActionState = { ok: true, error: null }

export function AcceptCampaignButton({
  campaignId,
  status,
}: {
  campaignId: string
  status: CampaignParticipantStatus | null
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(acceptCampaign, INITIAL)

  useEffect(() => {
    if (state.ok && !pending) router.refresh()
  }, [state, pending, router])

  const joined = status === 'aceito' || status === 'entregue'

  if (joined) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-brand/10 px-4 py-2 text-sm font-medium text-brand-deep">
        <CheckCircle2 className="h-4 w-4" />
        Você está participando
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <Button type="submit" disabled={pending} className="bg-[#1d1d1b] text-white hover:bg-black">
        {pending ? 'Entrando...' : 'Participar da campanha'}
      </Button>
      {state.error && <p className="mt-2 text-sm text-[#B91C1C]">{state.error}</p>}
    </form>
  )
}
