'use client'

import { useActionState } from 'react'
import { Mail, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { savePartnerProfile, type ProfileSaveState } from '@/app/(auth)/actions'

const INITIAL: ProfileSaveState = { ok: true, error: null }

interface ProfileSettingsFormProps {
  fullName: string
  handle: string
  email: string
  pixKey: string
  initials: string
}

export function ProfileSettingsForm({
  fullName,
  handle,
  email,
  pixKey,
  initials,
}: ProfileSettingsFormProps) {
  const [state, action, pending] = useActionState(savePartnerProfile, INITIAL)
  const saved = state.ok && state.error === null && !pending

  return (
    <form action={action} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-[#E5E5E5]">
          <AvatarFallback className="bg-[#1d1d1b] text-lg text-[#f6f6f6]">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-[#1d1d1b]">{fullName || 'Parceiro'}</p>
          <p className="text-xs text-[#9CA3AF]">As iniciais do avatar são geradas a partir do nome.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" name="full_name" defaultValue={fullName} className="border-[#E5E5E5]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handle">Nome de usuário</Label>
          <Input id="handle" name="handle" defaultValue={handle ? `@${handle}` : ''} placeholder="@seu.handle" className="border-[#E5E5E5]" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input id="email" type="email" defaultValue={email} disabled className="border-[#E5E5E5] pl-9" />
          </div>
          <p className="text-xs text-[#9CA3AF]">Para alterar o e-mail de acesso, fale com o time Tetra.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pix_key">Chave PIX</Label>
          <Input id="pix_key" name="pix_key" defaultValue={pixKey} placeholder="E-mail, CPF ou telefone" className="border-[#E5E5E5]" />
          <p className="text-xs text-[#9CA3AF]">Usamos esta chave para enviar seus repasses.</p>
        </div>
      </div>

      {state.error && <p className="text-sm text-[#EF4444]">{state.error}</p>}

      <div>
        <Button type="submit" disabled={pending} className="bg-[#0FB5A6] text-white hover:bg-[#0FB5A6]/90">
          {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {pending ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
