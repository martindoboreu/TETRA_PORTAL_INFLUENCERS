import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Right-aligned controls (filters, buttons, notification bell). */
  actions?: React.ReactNode
  /** Controls stacked below the title on mobile (e.g. a date range selector). */
  mobileActions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, mobileActions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 pl-12 lg:pl-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 hidden text-sm text-ink-muted sm:block">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 sm:gap-4">{actions}</div>}
      </div>
      {mobileActions && (
        <div className="border-t border-line px-4 py-3 sm:hidden">{mobileActions}</div>
      )}
    </header>
  )
}
