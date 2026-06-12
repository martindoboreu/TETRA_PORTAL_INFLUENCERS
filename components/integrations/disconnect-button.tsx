'use client'

import { useActionState } from 'react'
import { disconnectIntegration, type ConexaoState } from '@/app/dashboard/conexoes/actions'

const INITIAL: ConexaoState = { ok: false, error: null }

export function DisconnectButton({ provider }: { provider: string }) {
  const [state, action, pending] = useActionState(disconnectIntegration, INITIAL)
  return (
    <form action={action}>
      <input type="hidden" name="provider" value={provider} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-[#6B7280] underline-offset-2 transition-colors hover:text-[#1d1d1b] hover:underline disabled:opacity-60"
      >
        {pending ? 'Desconectando...' : 'Desconectar'}
      </button>
      {state.error && <p className="mt-1 text-xs text-[#EF4444]">{state.error}</p>}
    </form>
  )
}
