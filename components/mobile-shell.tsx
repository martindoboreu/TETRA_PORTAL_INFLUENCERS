'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function MobileShell({ sidebar, children }: MobileShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="fixed inset-y-0 left-0 z-50 hidden lg:block">{sidebar}</div>

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-2 text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f6f6f6]"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <main className="min-h-screen lg:ml-60">
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-30 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {children}
      </main>
    </div>
  )
}
