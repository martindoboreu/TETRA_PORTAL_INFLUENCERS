'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Gift, Megaphone, BadgeCheck, Wallet, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { markNotificationsRead } from '@/app/dashboard/notifications-actions'
import { formatRelativeTime } from '@/lib/format'
import type { PartnerNotification } from '@/lib/queries/notifications'
import type { NotificationType } from '@/lib/database.types'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  info: Bell,
  payout: Wallet,
  campaign: Megaphone,
  approval: CheckCircle2,
  milestone: BadgeCheck,
}

export function NotificationMenu({ notifications }: { notifications: PartnerNotification[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [unread, setUnread] = useState(() => notifications.filter((n) => !n.read_at).length)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && unread > 0) {
      setUnread(0)
      startTransition(async () => {
        await markNotificationsRead()
        router.refresh()
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notificações</p>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <Gift className="h-6 w-6 text-ink-subtle" />
            <p className="mt-2 text-sm font-medium text-ink">Tudo em dia</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Avisos sobre campanhas e repasses aparecem aqui.
            </p>
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type]
              const wasUnread = !n.read_at
              const body = (
                <div className="flex gap-3 px-4 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                    <Icon className="h-4 w-4 text-ink-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-ink-subtle">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              )
              return (
                <li key={n.id} className={cn('border-b border-line-soft last:border-0', wasUnread && 'bg-brand/[0.03]')}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => setOpen(false)} className="block transition-colors hover:bg-surface-muted">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
