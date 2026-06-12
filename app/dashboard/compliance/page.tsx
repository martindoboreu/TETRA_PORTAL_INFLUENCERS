import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import {
  AccountSecurityCard,
  ApprovalCard,
  ClaimsCard,
  DisclosureCard,
} from '@/components/compliance/compliance-cards'
import { getPartnerIntegrations, getPartnerProfile, requireUser } from '@/lib/queries/partner'

export const dynamic = 'force-dynamic'

export default async function CompliancePage() {
  const user = await requireUser()
  const [profile, integrations] = await Promise.all([
    getPartnerProfile(user.id),
    getPartnerIntegrations(user.id),
  ])

  const connectedNetworks = integrations.filter((i) => i.status === 'connected').length

  return (
    <>
      <PageHeader
        title="Compliance & Segurança"
        subtitle="Diretrizes de divulgação, claims aprovados e a segurança da sua conta"
        actions={<NotificationBell />}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <ClaimsCard />

        <div className="grid gap-6 lg:grid-cols-2">
          <DisclosureCard />
          <div className="space-y-6">
            <ApprovalCard />
            <AccountSecurityCard
              accountVerified={profile?.status === 'ativo'}
              pixConfigured={Boolean(profile?.pix_key)}
              connectedNetworks={connectedNetworks}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-ink-subtle">
          Dúvidas sobre um claim ou uma peça específica? Fale com o time Tetra antes de publicar —
          revisar antes é sempre mais rápido do que corrigir depois.
        </p>
      </div>
    </>
  )
}
