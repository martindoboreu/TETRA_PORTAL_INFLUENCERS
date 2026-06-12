'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'

type Status = 'todos' | 'ativo' | 'pendente' | 'inativo'

interface PartnerFiltersProps {
  initialSearch: string
  initialStatus: Status
  initialLevel: string
  levels: string[]
}

export function PartnerFilters({ initialSearch, initialStatus, initialLevel, levels }: PartnerFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (search.trim()) next.set('q', search.trim())
      else next.delete('q')
      const qs = next.toString()
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params.toString())
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    const qs = next.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  const statusOptions: { value: Status; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'ativo', label: 'Ativos' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'inativo', label: 'Inativos' },
  ]

  const levelOptions: { value: string; label: string }[] = [
    { value: 'todos', label: 'Status' },
    ...levels.map((l) => ({ value: l, label: l })),
  ]

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <Input
          placeholder="Buscar parceiro ou handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border-[#E5E5E5] pl-9 sm:w-56"
        />
      </div>

      <div className="inline-flex rounded-full border border-[#E5E5E5] bg-[#f6f6f6] p-1 text-sm">
        {statusOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setParam('status', o.value, 'todos')}
            className={
              'rounded-full px-3 py-1.5 font-medium transition-colors ' +
              (initialStatus === o.value
                ? 'bg-white text-[#1d1d1b] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1d1d1b]')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="inline-flex flex-wrap rounded-full border border-[#E5E5E5] bg-[#f6f6f6] p-1 text-sm">
        {levelOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setParam('level', o.value, 'todos')}
            className={
              'rounded-full px-3 py-1.5 font-medium transition-colors ' +
              (initialLevel === o.value
                ? 'bg-white text-[#1d1d1b] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1d1d1b]')
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
