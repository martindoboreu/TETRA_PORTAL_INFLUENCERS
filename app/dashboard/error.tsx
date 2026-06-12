'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-[#1d1d1b]">Não foi possível carregar os dados</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Houve um problema ao carregar seu painel. Tente novamente em instantes.
        </p>
        <Button onClick={reset} className="mt-6 bg-[#0FB5A6] text-white hover:bg-[#0FB5A6]/90">
          <RotateCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
