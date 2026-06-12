'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { connectIntegration, type ConexaoState } from '@/app/dashboard/conexoes/actions'

const INITIAL: ConexaoState = { ok: false, error: null }

interface ConnectDialogProps {
  provider: string
  label: string
  metricLabel: string
}

export function ConnectDialog({ provider, label, metricLabel }: ConnectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(connectIntegration, INITIAL)

  useEffect(() => {
    if (state.ok && state.error === null && open) {
      setOpen(false)
      router.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-[#1d1d1b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
      >
        Conectar {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar {label}</DialogTitle>
            <DialogDescription>
              Informe o perfil e o número de {metricLabel}. Esses dados ajudam o time Tetra a conhecer seu alcance.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <input type="hidden" name="provider" value={provider} />
            <div className="space-y-2">
              <Label htmlFor={`handle-${provider}`}>Perfil (@ ou URL)</Label>
              <Input
                id={`handle-${provider}`}
                name="handle"
                placeholder="@seuperfil"
                required
                className="border-[#E5E5E5]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`followers-${provider}`}>{metricLabel.charAt(0).toUpperCase() + metricLabel.slice(1)}</Label>
              <Input
                id={`followers-${provider}`}
                name="follower_count"
                type="number"
                min={0}
                step={1}
                placeholder="Ex.: 25000"
                required
                className="border-[#E5E5E5]"
              />
            </div>
            {state.error && <p className="text-sm text-[#EF4444]">{state.error}</p>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-[#E5E5E5]">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending} className="bg-[#0FB5A6] text-white hover:bg-[#0E9F92]">
                {pending ? 'Conectando...' : 'Conectar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
