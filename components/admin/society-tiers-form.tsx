'use client'

import { useActionState } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SocietyMark } from '@/components/society/society-mark'
import { updateSocietyTierRate, type AdminActionState } from '@/app/admin/actions'
import type { SocietyTierKey } from '@/lib/database.types'

const INITIAL: AdminActionState = { ok: true, error: null }

type Tier = {
  id: number
  key: SocietyTierKey
  name: string
  commission_rate: number
  invite_only: boolean
}

function TierRow({ tier }: { tier: Tier }) {
  const [state, action, pending] = useActionState(updateSocietyTierRate, INITIAL)
  const saved = state.ok && state.error === null && !pending

  return (
    <form action={action} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E5E5] p-3">
      <input type="hidden" name="tier_id" value={tier.id} />
      <SocietyMark tier={tier.key} full />
      {tier.invite_only && <span className="text-xs text-[#9CA3AF]">Apenas por convite</span>}
      <div className="ml-auto flex items-center gap-2">
        <Input
          name="commission_rate_pct"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={Math.round(tier.commission_rate * 100)}
          className="h-9 w-20 border-[#E5E5E5]"
        />
        <span className="text-sm text-[#6B7280]">%</span>
        <Button type="submit" size="sm" disabled={pending} className="h-9 bg-[#1d1d1b] text-white hover:bg-black">
          {saved ? <Check className="h-4 w-4" /> : pending ? '...' : 'Salvar'}
        </Button>
      </div>
      {state.error && <p className="w-full text-xs text-[#EF4444]">{state.error}</p>}
    </form>
  )
}

export function SocietyTiersForm({ tiers }: { tiers: Tier[] }) {
  return (
    <div className="space-y-3">
      {tiers.map((t) => (
        <TierRow key={t.id} tier={t} />
      ))}
      <p className="text-xs text-[#9CA3AF]">
        A comissão por conversão acompanha o status na Tetra Society. Editar a taxa reaplica a todos os
        parceiros do status. Os convites são feitos manualmente em Parceiros.
      </p>
    </div>
  )
}
