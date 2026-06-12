'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signIn, type SignInState } from '@/app/(auth)/actions'

const initial: SignInState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="mt-3 h-12 w-full rounded-xl bg-[#0FB5A6] text-[15px] font-semibold text-white transition-colors hover:bg-[#0E9F92] disabled:opacity-70"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Entrando...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          Entrar no portal
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initial)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-[#FCA5A5]">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[rgba(255,255,255,0.8)]">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/10 bg-[#161614] px-4 py-3 text-[15px] text-[#f6f6f6] placeholder-[rgba(255,255,255,0.35)] transition-colors focus:border-[#0FB5A6] focus:outline-none focus:ring-2 focus:ring-[#0FB5A6]/20"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[rgba(255,255,255,0.8)]">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-white/10 bg-[#161614] px-4 py-3 pr-11 text-[15px] text-[#f6f6f6] placeholder-[rgba(255,255,255,0.35)] transition-colors focus:border-[#0FB5A6] focus:outline-none focus:ring-2 focus:ring-[#0FB5A6]/20"
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

      <SubmitButton />
    </form>
  )
}
