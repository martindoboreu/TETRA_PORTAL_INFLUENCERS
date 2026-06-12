import Link from 'next/link'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChecklistItem {
  label: string
  description: string
  done: boolean
  href: string
}

export function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const completed = items.filter((i) => i.done).length
  const total = items.length
  const pct = total === 0 ? 100 : Math.round((completed / total) * 100)
  const allDone = completed === total

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">
            {allDone ? 'Configuração concluída' : 'Complete sua configuração'}
          </h2>
          <p className="text-sm text-ink-muted">
            {allDone
              ? 'Tudo pronto para você aproveitar ao máximo a parceria.'
              : 'Finalize os passos abaixo para liberar todo o potencial da sua conta.'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums text-ink">{pct}%</p>
          <p className="text-micro">
            {completed}/{total}
          </p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line-soft">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl p-3 transition-colors',
                item.done ? 'opacity-70' : 'hover:bg-surface-muted'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  item.done ? 'bg-brand text-white' : 'border border-line text-ink-subtle'
                )}
              >
                {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
              </span>
              <span className="min-w-0">
                <span className={cn('block text-sm font-medium', item.done ? 'text-ink-muted line-through' : 'text-ink')}>
                  {item.label}
                </span>
                {!item.done && <span className="block text-xs text-ink-muted">{item.description}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
