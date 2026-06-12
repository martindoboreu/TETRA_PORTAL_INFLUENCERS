import Link from 'next/link'
import { ArrowRight, CheckCircle2, KeyRound, Link2, Share2, type LucideIcon } from 'lucide-react'

interface ActionItem {
  icon: LucideIcon
  title: string
  description: string
  href: string
  cta: string
}

interface NextActionsProps {
  pixKeyMissing: boolean
  noActiveLink: boolean
  noSocialConnected: boolean
}

export function NextActions({ pixKeyMissing, noActiveLink, noSocialConnected }: NextActionsProps) {
  const actions: ActionItem[] = []

  if (pixKeyMissing) {
    actions.push({
      icon: KeyRound,
      title: 'Cadastre sua chave PIX',
      description: 'Sem ela não conseguimos liberar seus repasses.',
      href: '/dashboard/configuracoes#perfil',
      cta: 'Adicionar PIX',
    })
  }
  if (noActiveLink) {
    actions.push({
      icon: Link2,
      title: 'Crie seu primeiro link',
      description: 'Gere um link rastreável para começar a divulgar a Tetra.',
      href: '/dashboard/links',
      cta: 'Criar link',
    })
  }
  if (noSocialConnected) {
    actions.push({
      icon: Share2,
      title: 'Conecte uma rede social',
      description: 'Vincule seu perfil para validar seu alcance.',
      href: '/dashboard/configuracoes#redes-sociais',
      cta: 'Conectar',
    })
  }

  if (actions.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
          <CheckCircle2 className="h-5 w-5 text-brand" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Tudo pronto por aqui</p>
          <p className="text-sm text-ink-muted">
            Sua conta está configurada. Foque em divulgar e acompanhar seus resultados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--elevation-card)]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Próximos passos</h2>
        <span className="text-micro">{actions.length} pendente{actions.length > 1 ? 's' : ''}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.title}
            href={a.href}
            className="group flex flex-col gap-2 rounded-xl border border-line bg-surface-muted/50 p-4 transition-colors hover:border-brand/40 hover:bg-brand/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-[var(--elevation-card)]">
              <a.icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-ink">{a.title}</p>
            <p className="text-xs text-ink-muted">{a.description}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand">
              {a.cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
