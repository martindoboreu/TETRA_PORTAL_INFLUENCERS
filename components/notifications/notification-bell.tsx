import { NotificationMenu } from '@/components/notifications/notification-menu'
import { getPartnerNotifications } from '@/lib/queries/notifications'
import { createClient } from '@/lib/supabase/server'

// Async server component: fetches the current partner's notifications and renders
// the interactive menu. Safe to mount in any partner PageHeader.
export async function NotificationBell() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const notifications = await getPartnerNotifications(user.id)
  return <NotificationMenu notifications={notifications} />
}
