'use client'

import {
  LayoutDashboard,
  Link2,
  ArrowLeftRight,
  Wallet,
  FolderOpen,
  Settings,
  Landmark,
  Megaphone,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/(auth)/actions'

const navItems = [
  { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Campanhas', href: '/dashboard/campanhas', icon: Megaphone },
  { label: 'Links e Cupons', href: '/dashboard/links', icon: Link2 },
  { label: 'Conversões', href: '/dashboard/conversoes', icon: ArrowLeftRight },
  { label: 'Pagamentos', href: '/dashboard/comissoes', icon: Wallet },
  { label: 'Society', href: '/dashboard/society', icon: Landmark },
  { label: 'Materiais', href: '/dashboard/materiais', icon: FolderOpen },
  { label: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
  profile?: {
    full_name: string | null
    handle: string | null
    avatar_initials: string | null
  }
}

export function Sidebar({ onClose, profile }: SidebarProps) {
  const pathname = usePathname()

  const fullName = profile?.full_name ?? 'Parceiro'
  const handle = profile?.handle ? `@${profile.handle}` : '—'
  const initials = profile?.avatar_initials ?? '–'

  return (
    <aside className="flex h-screen w-60 flex-col bg-[#1d1d1b]">
      <div className="flex h-28 items-center px-5">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PNG-02-x1O0UFMLLLAJKixhCo2vWIZIA9Nx1Z.png"
          alt="Tetra Educação"
          width={300}
          height={105}
          className="h-20 w-auto"
          priority
        />
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-[#f6f6f6]'
                      : 'text-white/55 hover:bg-white/5 hover:text-white/90'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-white/15">
            <AvatarFallback className="bg-white/10 text-xs font-medium text-[#f6f6f6]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#f6f6f6]">{fullName}</p>
            <p className="truncate text-xs text-white/45">{handle}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sair"
              className="rounded-md p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
