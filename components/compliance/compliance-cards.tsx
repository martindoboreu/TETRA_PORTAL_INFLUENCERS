import { BadgeCheck, Ban, Check, KeyRound, Megaphone, ShieldCheck, Sparkles } from 'lucide-react'
import {
  APPROVED_CLAIMS,
  CAMPAIGN_APPROVAL_STEPS,
  DISCLOSURE_RULES,
  FORBIDDEN_CLAIMS,
} from '@/lib/compliance'

// --- Disclosure obligations -------------------------------------------------

export function DisclosureCard() {
  return (
    <section className="tetra-card p-6">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-ink-muted" />
        <h2 className="text-base font-semibold text-ink">Identificação de publicidade</h2>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Obrigatório em todo conteúdo com link ou cupom Tetra.
      </p>
      <ul className="mt-4 space-y-4">
        {DISCLOSURE_RULES.map((rule) => (
          <li key={rule.id} className="flex gap-3">
            {rule.id === 'ai-content' ? (
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#0FB5A6]" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0FB5A6]" />
            )}
            <div>
              <p className="text-sm font-medium text-ink">{rule.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{rule.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// --- Approved vs. forbidden claims -------------------------------------------

export function ClaimsCard() {
  return (
    <section className="tetra-card overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-base font-semibold text-ink">O que você pode afirmar</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Claims validados pelo time Tetra — e os que colocam sua parceria em risco.
        </p>
      </div>
      <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-6 pt-4">
          <p className="text-micro">Aprovados</p>
          <ul className="mt-3 space-y-2.5">
            {APPROVED_CLAIMS.map((claim) => (
              <li key={claim} className="flex gap-2.5 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0FB5A6]" />
                {claim}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface-muted/50 p-6 pt-4">
          <p className="text-micro">Proibidos</p>
          <ul className="mt-3 space-y-2.5">
            {FORBIDDEN_CLAIMS.map((claim) => (
              <li key={claim} className="flex gap-2.5 text-sm text-ink-muted">
                <Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]" />
                {claim}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// --- Campaign approval flow ---------------------------------------------------

export function ApprovalCard() {
  return (
    <section className="tetra-card p-6">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-ink-muted" />
        <h2 className="text-base font-semibold text-ink">Aprovação de campanhas</h2>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Como uma peça vai ao ar sem fricção.</p>
      <ol className="mt-4 space-y-4">
        {CAMPAIGN_APPROVAL_STEPS.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1d1d1b] text-xs font-semibold text-white">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{step.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// --- Account security status ---------------------------------------------------

interface AccountSecurityCardProps {
  accountVerified: boolean
  pixConfigured: boolean
  connectedNetworks: number
}

export function AccountSecurityCard({
  accountVerified,
  pixConfigured,
  connectedNetworks,
}: AccountSecurityCardProps) {
  const items = [
    {
      id: 'verification',
      label: 'Verificação da conta',
      detail: accountVerified
        ? 'Cadastro aprovado pela equipe Tetra.'
        : 'Cadastro em análise pela equipe Tetra.',
      ok: accountVerified,
    },
    {
      id: 'pix',
      label: 'Recebimento via PIX',
      detail: pixConfigured
        ? 'Chave PIX cadastrada — repasses habilitados.'
        : 'Cadastre sua chave PIX em Configurações para receber repasses.',
      ok: pixConfigured,
    },
    {
      id: 'networks',
      label: 'Redes conectadas',
      detail:
        connectedNetworks > 0
          ? `${connectedNetworks} ${connectedNetworks === 1 ? 'rede validada' : 'redes validadas'} para divulgação.`
          : 'Conecte uma rede social para validar seu alcance.',
      ok: connectedNetworks > 0,
    },
    {
      id: 'password',
      label: 'Senha e acesso',
      detail: 'Autenticação gerenciada pela Tetra. Nunca pedimos sua senha por mensagem.',
      ok: true,
    },
  ]

  return (
    <section className="tetra-card p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-ink-muted" />
        <h2 className="text-base font-semibold text-ink">Segurança da conta</h2>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Status de verificação e pagamento.</p>
      <ul className="mt-4 divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-3">
            {item.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0FB5A6]" />
            ) : (
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <span
                  className={
                    'rounded-full border px-2 py-0.5 text-[11px] font-medium ' +
                    (item.ok
                      ? 'border-[#0FB5A6]/30 bg-[#0FB5A6]/10 text-[#0E7C73]'
                      : 'border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#B45309]')
                  }
                >
                  {item.ok ? 'Ativo' : 'Pendente'}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
