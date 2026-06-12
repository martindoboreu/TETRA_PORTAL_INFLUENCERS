import { cn } from '@/lib/utils'

type Tone = 'success' | 'pending' | 'danger' | 'neutral' | 'info'

interface StatusMeta {
  label: string
  tone: Tone
}

// Single source of truth for every status surfaced to partners and admins.
const STATUS_MAP: Record<string, StatusMeta> = {
  // conversions
  pago: { label: 'Pago', tone: 'success' },
  confirmado: { label: 'Confirmado', tone: 'info' },
  reembolsado: { label: 'Reembolsado', tone: 'danger' },
  // payouts
  pendente: { label: 'Pendente', tone: 'pending' },
  // links
  active: { label: 'Ativo', tone: 'success' },
  paused: { label: 'Pausado', tone: 'neutral' },
  // profile / partner
  ativo: { label: 'Ativo', tone: 'success' },
  inativo: { label: 'Inativo', tone: 'neutral' },
  // campaigns
  ativa: { label: 'Ativa', tone: 'success' },
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  encerrada: { label: 'Encerrada', tone: 'neutral' },
  // campaign participants
  convidado: { label: 'Convidado', tone: 'info' },
  aceito: { label: 'Aceito', tone: 'success' },
  entregue: { label: 'Entregue', tone: 'success' },
}

const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-brand/10 text-brand-deep',
  info: 'bg-[#1d1d1b]/[0.06] text-ink',
  pending: 'bg-[#F59E0B]/15 text-[#B45309]',
  danger: 'bg-[#EF4444]/10 text-[#B91C1C]',
  neutral: 'bg-surface-muted text-ink-muted',
}

const DOT_CLASS: Record<Tone, string> = {
  success: 'bg-brand',
  info: 'bg-ink',
  pending: 'bg-[#F59E0B]',
  danger: 'bg-[#EF4444]',
  neutral: 'bg-ink-subtle',
}

interface StatusBadgeProps {
  status: string
  /** Override the mapped label. */
  label?: string
  /** Hide the leading dot. */
  hideDot?: boolean
  className?: string
}

export function StatusBadge({ status, label, hideDot, className }: StatusBadgeProps) {
  const meta = STATUS_MAP[status] ?? { label: label ?? status, tone: 'neutral' as Tone }
  const tone = meta.tone

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className
      )}
    >
      {!hideDot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASS[tone])} />}
      {label ?? meta.label}
    </span>
  )
}
