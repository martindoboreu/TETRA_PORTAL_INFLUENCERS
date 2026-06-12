'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
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
import { createLink, type LinkActionState } from '@/app/dashboard/links/actions'

const INITIAL: LinkActionState = { ok: false, error: null }

export function NewLinkButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createLink, INITIAL)

  useEffect(() => {
    if (state.ok && state.error === null && open) {
      setOpen(false)
      router.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-10 bg-[#0FB5A6] text-white hover:bg-[#0E9F92]"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Novo link
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar novo link</DialogTitle>
            <DialogDescription>
              Gere um link de indicação rastreável. O endereço curto é criado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-label">Nome do link</Label>
              <Input
                id="link-label"
                name="label"
                placeholder="Ex.: Stories Instagram - Outubro"
                required
                className="border-[#E5E5E5]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-slug">Apelido do endereço (opcional)</Label>
              <Input
                id="link-slug"
                name="slug"
                placeholder="ex.: stories-out"
                className="border-[#E5E5E5]"
              />
              <p className="text-xs text-[#9CA3AF]">
                Vira algo como tetra.link/stories-out-x9k2. Deixe em branco para gerar do nome.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-coupon">Cupom de desconto (opcional)</Label>
              <Input
                id="link-coupon"
                name="discount_code"
                placeholder="ex.: MARINA10"
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
                {pending ? 'Criando...' : 'Criar link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
