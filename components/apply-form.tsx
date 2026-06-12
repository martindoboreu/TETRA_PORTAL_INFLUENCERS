'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { applyAsAffiliate, type ApplyState } from '@/app/(auth)/actions'

const initial: ApplyState = { ok: false, error: null }

const inputCls =
  'w-full rounded-xl border border-white/10 bg-[#161614] px-4 py-3 text-[15px] text-[#f6f6f6] placeholder-[rgba(255,255,255,0.35)] transition-colors focus:border-[#0FB5A6] focus:outline-none focus:ring-2 focus:ring-[#0FB5A6]/20'
const labelCls = 'mb-1.5 block text-sm font-medium text-[rgba(255,255,255,0.8)]'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="mt-2 h-12 w-full rounded-xl bg-[#0FB5A6] text-[15px] font-semibold text-white transition-colors hover:bg-[#0E9F92] disabled:opacity-70"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Enviando...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          Enviar inscrição
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </Button>
  )
}

export function ApplyForm() {
  const [state, formAction] = useActionState(applyAsAffiliate, initial)
  const [showPassword, setShowPassword] = useState(false)

  if (state.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0FB5A6]/15">
          <CheckCircle2 className="h-6 w-6 text-[#0FB5A6]" />
        </div>
        <h2 className="text-[18px] font-medium text-[#f6f6f6]">Inscrição recebida</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[rgba(255,255,255,0.55)]">
          Vamos avaliar seu perfil e avisar por e-mail assim que seu acesso for liberado. Se pedirmos
          confirmação de e-mail, confira sua caixa de entrada.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-[#0FB5A6] transition-colors hover:text-[#3DD6C8]"
        >
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-[#FCA5A5]">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className={labelCls}>Nome completo</label>
        <input id="full_name" name="full_name" type="text" required autoComplete="name" placeholder="Seu nome" className={inputCls} />
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className={inputCls} />
      </div>

      <div>
        <label htmlFor="password" className={labelCls}>Senha</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[rgba(255,255,255,0.5)] transition-colors hover:text-[#f6f6f6]"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="primary_social" className={labelCls}>Rede principal</label>
          <input id="primary_social" name="primary_social" type="text" placeholder="Instagram, YouTube..." className={inputCls} />
        </div>
        <div>
          <label htmlFor="follower_count" className={labelCls}>Seguidores</label>
          <input id="follower_count" name="follower_count" type="text" inputMode="numeric" placeholder="ex.: 12000" className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="handle" className={labelCls}>Seu @ / perfil</label>
        <input id="handle" name="handle" type="text" placeholder="@seu.perfil" className={inputCls} />
      </div>

      <div>
        <label htmlFor="pitch" className={labelCls}>Sobre seu público <span className="text-[rgba(255,255,255,0.4)]">(opcional)</span></label>
        <textarea id="pitch" name="pitch" rows={3} placeholder="Conte sobre seu conteúdo e audiência — o que você ensina, quem te acompanha." className={`${inputCls} resize-none`} />
      </div>

      <SubmitButton />
    </form>
  )
}
