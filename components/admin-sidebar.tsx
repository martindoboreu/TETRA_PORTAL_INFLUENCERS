'use client'

import { LayoutDashboard, Users, Wallet, Landmark, Settings, LogOut, ClipboardCheck, Megaphone, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/(auth)/actions'

const navItems = [
  { label: 'Visão Geral',  icon: LayoutDashboard, href: '/admin' },
  { label: 'Aprovações',   icon: ClipboardCheck,  href: '/admin/aprovacoes' },
  { label: 'Parceiros',    icon: Users,           href: '/admin/parceiros' },
  { label: 'Campanhas',    icon: Megaphone,       href: '/admin/campanhas' },
  { label: 'Materiais',    icon: FolderOpen,      href: '/admin/materiais' },
  { label: 'Repasses',     icon: Wallet,          href: '/admin/repasses' },
  { label: 'Society',      icon: Landmark,        href: '/admin/society' },
  { label: 'Configurações', icon: Settings,       href: '/admin/configuracoes' },
]

interface AdminSidebarProps {
  onClose?: () => void
  profile?: {
    full_name: string | null
    handle: string | null
    avatar_initials: string | null
  }
}

export function AdminSidebar({ onClose, profile }: AdminSidebarProps) {
  const pathname = usePathname()

  const fullName = profile?.full_name ?? 'Administrador'
  const handle = profile?.handle ? `@${profile.handle}` : 'Equipe Tetra'
  const initials = profile?.avatar_initials ?? 'AD'

  return (
    <aside className="flex h-screen w-60 flex-col bg-[#1d1d1b]">
      <div className="flex h-28 items-center px-5">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PNG-02-x1O0UFMLLLAJKixhCo2vWIZIA9Nx1Z.png"
          alt="Tetra Educação"
          width={300}
          height={105}
          className="h-20 w-auto"
        />
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#0FB5A6]/15 text-[#0FB5A6]'
                      : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f6f6f6]'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-[#0FB5A6]' : 'text-[rgba(255,255,255,0.5)]'
                    )}
                  />
                  {item.label}
                  {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-[#0FB5A6]" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-[rgba(255,255,255,0.1)] p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-[rgba(255,255,255,0.2)]">
            <AvatarFallback className="bg-[rgba(255,255,255,0.1)] text-sm font-medium text-[#f6f6f6]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#f6f6f6]">{fullName}</p>
            <p className="truncate text-xs text-[rgba(255,255,255,0.5)]">{handle}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sair"
              className="rounded-lg p-1.5 text-[rgba(255,255,255,0.5)] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f6f6f6]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
