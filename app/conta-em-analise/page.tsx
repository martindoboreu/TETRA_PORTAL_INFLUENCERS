import Image from 'next/image'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function ContaEmAnalisePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name, status, role').eq('id', user.id).maybeSingle()
    : { data: null }

  if (profile?.role === 'admin') redirect('/admin')

  const inativo = profile?.status === 'inativo'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f6f6] px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 flex justify-center">
          <div className="rounded-2xl bg-[#1d1d1b] px-6 py-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PNG-02-x1O0UFMLLLAJKixhCo2vWIZIA9Nx1Z.png"
              alt="Tetra Educação"
              width={180}
              height={63}
              className="h-auto w-[180px]"
              priority
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#1d1d1b]">
            {inativo ? 'Conta desativada' : 'Conta em análise'}
          </h1>
          <p className="mt-2 text-[15px] text-[#6B7280]">
            {inativo
              ? 'Sua conta de parceiro foi desativada. Fale com o time para reativar.'
              : 'Seu cadastro foi recebido e está sendo avaliado pelo time Tetra. Avisamos por e-mail assim que seu acesso for liberado.'}
          </p>

          <div className="mt-6 rounded-xl border border-[#E5E5E5] bg-[#f6f6f6] p-4">
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">Logado como</p>
            <p className="mt-1 text-sm font-medium text-[#1d1d1b]">
              {profile?.full_name ?? user?.email ?? '—'}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:parcerias@tetraeducacao.com.br"
              className="flex-1 rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-center text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#f6f6f6]"
            >
              Falar com o time
            </a>
            <form action={signOut} className="flex-1">
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#1d1d1b] text-[15px] font-semibold text-white hover:bg-[#000]"
              >
                Sair
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
