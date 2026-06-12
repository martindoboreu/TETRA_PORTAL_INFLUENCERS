'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markPartnerPaid, type AdminActionState } from '@/app/admin/actions'

const INITIAL: AdminActionState = { ok: true, error: null }

interface MarkPaidButtonProps {
  partnerId: string
  amount: number
  disabled?: boolean
  size?: 'sm' | 'default'
}

export function MarkPaidButton({ partnerId, amount, disabled, size = 'sm' }: MarkPaidButtonProps) {
  const router = useRouter()
  const [state, action, pending] = useActionState(markPartnerPaid, INITIAL)

  useEffect(() => {
    if (state.ok && state.error === null) router.refresh()
  }, [state, router])

  return (
    <form action={action} className="inline-flex flex-col items-end">
      <input type="hidden" name="partner_id" value={partnerId} />
      <Button
        type="submit"
        size={size}
        disabled={disabled || pending || amount <= 0}
        className="bg-[#0FB5A6] text-white hover:bg-[#0FB5A6]/90 disabled:opacity-40"
      >
        <Wallet className="mr-1.5 h-3.5 w-3.5" />
        {pending ? 'Processando...' : 'Marcar como pago'}
      </Button>
      {state.error && <span className="mt-1 text-xs text-[#EF4444]">{state.error}</span>}
    </form>
  )
}
