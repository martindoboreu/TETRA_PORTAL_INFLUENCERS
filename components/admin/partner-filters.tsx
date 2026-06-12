'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Status = 'todos' | 'ativo' | 'pendente' | 'inativo'

interface PartnerFiltersProps {
  initialSearch: string
  initialStatus: Status
  /** Society tier key ('select' | 'signature' | ...) or 'todos'. */
  initialLevel: string
  /** Society tiers as key/name pairs. */
  levels: { value: string; label: string }[]
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs sm:flex-none">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <Input
          placeholder="Buscar parceiro ou handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full border-[#E5E5E5] pl-9 sm:w-64"
        />
      </div>

      <div
        role="group"
        aria-label="Filtrar por status da conta"
        className="inline-flex h-9 items-center rounded-full border border-[#E5E5E5] bg-[#f6f6f6] p-0.5 text-sm"
      >
        {statusOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setParam('status', o.value, 'todos')}
            className={
              'rounded-full px-3 py-1 font-medium transition-colors ' +
              (initialStatus === o.value
                ? 'bg-white text-[#1d1d1b] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1d1d1b]')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      <Select
        value={initialLevel}
        onValueChange={(value) => setParam('level', value, 'todos')}
      >
        <SelectTrigger
          aria-label="Filtrar por status na Tetra Society"
          className="h-9 w-[180px] rounded-full border-[#E5E5E5] bg-white text-sm"
        >
          <SelectValue placeholder="Society" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Society · todos</SelectItem>
          {levels.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
