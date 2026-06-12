'use client'

import { useActionState } from 'react'
import { Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveProgramSettings, type AdminActionState } from '@/app/admin/actions'

const INITIAL: AdminActionState = { ok: true, error: null }

interface SettingsFormProps {
  defaultRatePct: number
  nextPayoutDate: string | null
}

export function SettingsForm({ defaultRatePct, nextPayoutDate }: SettingsFormProps) {
  const [state, action, pending] = useActionState(saveProgramSettings, INITIAL)
  const saved = state.ok && state.error === null && !pending

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="default_commission_rate_pct">Taxa de comissão padrão (%)</Label>
          <Input
            id="default_commission_rate_pct"
            name="default_commission_rate_pct"
            type="number"
            min={0}
            max={100}
            step={1}
            defaultValue={defaultRatePct}
            className="border-[#E5E5E5]"
          />
          <p className="text-xs text-[#9CA3AF]">Aplicada a novos parceiros como ponto de partida.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="next_payout_date">Próximo repasse</Label>
          <Input
            id="next_payout_date"
            name="next_payout_date"
            type="date"
            defaultValue={nextPayoutDate ?? ''}
            className="border-[#E5E5E5]"
          />
          <p className="text-xs text-[#9CA3AF]">Data exibida aos parceiros no painel.</p>
        </div>
      </div>

      {state.error && <p className="text-sm text-[#EF4444]">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="bg-[#0FB5A6] text-white hover:bg-[#0FB5A6]/90">
          {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {pending ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
