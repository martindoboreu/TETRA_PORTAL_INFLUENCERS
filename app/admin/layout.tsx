import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { MobileShell } from '@/components/mobile-shell'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
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
    .select('full_name, handle, avatar_initials, role')
    .eq('id', user.id)
    .maybeSingle()

  // Middleware guards this too, but defend in depth.
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <MobileShell
      sidebar={
        <AdminSidebar
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
