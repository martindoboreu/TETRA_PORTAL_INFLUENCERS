import Image from 'next/image'
import Link from 'next/link'
import { ApplyForm } from '@/components/apply-form'

export const metadata = {
  title: 'Seja afiliado | Tetra Educação',
  description: 'Candidate-se ao programa de afiliados da Tetra Educação.',
}

export default function AplicarPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#161614] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0FB5A6] opacity-[0.07] blur-[120px]"
      />

      <div className="relative w-full max-w-[460px]">
        <div className="mb-8 flex justify-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PNG-02-x1O0UFMLLLAJKixhCo2vWIZIA9Nx1Z.png"
            alt="Tetra Educação"
            width={180}
            height={63}
            className="h-auto w-[176px]"
            priority
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#201f1d] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
          <div className="mb-7 text-center">
            <h1 className="text-[22px] font-normal text-[#f6f6f6]">Seja um afiliado Tetra</h1>
            <p className="mt-1.5 text-[14px] text-[rgba(255,255,255,0.55)]">
              Conte um pouco sobre você. Avaliamos cada inscrição — criadores de todos os tamanhos são bem-vindos.
            </p>
          </div>

          <ApplyForm />

          <p className="mt-7 text-center text-sm text-[rgba(255,255,255,0.55)]">
            Já é afiliado?{' '}
            <Link href="/" className="font-medium text-[#0FB5A6] transition-colors hover:text-[#3DD6C8]">
              Entrar
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-[rgba(255,255,255,0.35)]">
          © 2026 Tetra Educação. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}
