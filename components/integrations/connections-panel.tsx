import { DisconnectButton } from '@/components/integrations/disconnect-button'
import { ConnectDialog } from '@/components/integrations/connect-dialog'
import { BRAND_ICONS } from '@/components/integrations/brand-icons'
import { PROVIDERS, PROVIDER_ORDER } from '@/lib/integrations/providers'

type Integration = {
  provider: string
  external_handle: string | null
  follower_count: number
  last_synced_at: string | null
}

interface ConnectionsPanelProps {
  integrations: Integration[]
  connected?: string
  error?: string
  returnTo?: 'onboarding' | 'configuracoes'
  variant?: 'onboarding' | 'settings'
}

export function ConnectionsPanel({
  integrations,
  connected,
  error,
  returnTo = 'configuracoes',
  variant = 'settings',
}: ConnectionsPanelProps) {
  const oauthReturn = returnTo === 'onboarding' ? 'onboarding' : 'configuracoes'
  const byProvider = new Map(integrations.map((i) => [i.provider, i]))

  return (
    <div className="space-y-4">
      {connected && PROVIDERS[connected as keyof typeof PROVIDERS] && (
        <p className="text-sm text-[#0E7C73]">
          {PROVIDERS[connected as keyof typeof PROVIDERS].label} conectado.
        </p>
      )}
      {error === 'config' && (
        <p className="text-sm text-[#6B7280]">
          Login com Instagram ou Facebook estará disponível em breve. Conecte pelo YouTube, TikTok ou
          Google informando seu @.
        </p>
      )}
      {error && error !== 'config' && (
        <p className="text-sm text-[#B91C1C]">Não foi possível conectar. Tente novamente.</p>
      )}

      <div className="space-y-3">
        {PROVIDER_ORDER.map((id) => {
          const meta = PROVIDERS[id]
          const conn = byProvider.get(id)
          const Icon = BRAND_ICONS[id]
          return (
            <div
              key={id}
              className="flex flex-col gap-4 border-b border-[#E5E5E5] py-4 last:border-0 last:pb-0 first:pt-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1d1d1b]">{meta.label}</p>
                  {conn ? (
                    <p className="text-sm text-[#6B7280]">{conn.external_handle}</p>
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">Não conectado</p>
                  )}
                </div>
              </div>
              <div>
                {conn ? (
                  <DisconnectButton provider={id} />
                ) : id === 'instagram' || id === 'meta' ? (
                  <a
                    href={`/api/integrations/${id}/connect?return=${oauthReturn}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1d1d1b] px-4 text-sm font-medium text-white transition-colors hover:bg-black"
                  >
                    Conectar {meta.label}
                  </a>
                ) : (
                  <ConnectDialog provider={id} label={meta.label} metricLabel={meta.metricLabel} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
