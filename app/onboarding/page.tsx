import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerIntegrations } from '@/lib/queries/partner'
import { ConnectionsPanel } from '@/components/integrations/connections-panel'
import { signOut } from '@/app/(auth)/actions'

export const dynamic = 'force-dynamic'

interface OnboardingPageProps {
  searchParams: Promise<{ connected?: string; error?: string }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { connected, error } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.status !== 'ativo') redirect('/conta-em-analise')
  const integrations = await getPartnerIntegrations(user.id)
  if (profile?.onboarding_completed || integrations.length >= 1) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#f6f6f6] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="rounded-xl bg-[#1d1d1b] px-4 py-2.5">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PNG-02-x1O0UFMLLLAJKixhCo2vWIZIA9Nx1Z.png"
              alt="Tetra Educação"
              width={130}
              height={45}
              className="h-8 w-auto"
              priority
            />
          </div>
          <form action={signOut}>
            <button className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#1d1d1b]">
              Sair
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-8">
          <div className="mb-8 border-b border-[#E5E5E5] pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1b]">
              Conecte sua rede social
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              Informe o perfil que você usa para divulgar. Você só precisa fazer isso uma vez, na entrada
              ao programa.
            </p>
          </div>

          <ConnectionsPanel
            integrations={integrations}
            connected={connected}
            error={error}
            returnTo="onboarding"
            variant="onboarding"
          />
        </div>
      </div>
    </div>
  )
}
