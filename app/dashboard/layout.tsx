import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { MobileShell } from '@/components/mobile-shell'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, handle, avatar_initials, role, status, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  // Middleware should have handled these, but defend in depth.
  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.status && profile.status !== 'ativo') redirect('/conta-em-analise')
  if (profile && profile.onboarding_completed === false) redirect('/onboarding')

  return (
    <MobileShell
      sidebar={
        <Sidebar
          profile={{
            full_name: profile?.full_name ?? null,
            handle: profile?.handle ?? null,
            avatar_initials: profile?.avatar_initials ?? null,
          }}
        />
      }
    >
      {children}
    </MobileShell>
  )
}
