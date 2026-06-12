import { User, CreditCard, Shield, Bell, Share2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SetupChecklist, type ChecklistItem } from '@/components/setup-checklist'
import { ProfileSettingsForm } from '@/components/profile-settings-form'
import { ConnectionsPanel } from '@/components/integrations/connections-panel'
import {
  getPartnerProfile,
  getPartnerIntegrations,
  getPartnerLinks,
  requireUser,
} from '@/lib/queries/partner'

export const dynamic = 'force-dynamic'

interface ConfiguracoesPageProps {
  searchParams: Promise<{ connected?: string; error?: string }>
}

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const { connected, error } = await searchParams
  const user = await requireUser()
  const [profile, integrations, links] = await Promise.all([
    getPartnerProfile(user.id),
    getPartnerIntegrations(user.id),
    getPartnerLinks(user.id),
  ])

  const ratePct = Math.round((profile?.commission_rate ?? 0.3) * 100)

  const checklist: ChecklistItem[] = [
    {
      label: 'Complete seu perfil',
      description: 'Adicione seu nome e @ de identificação.',
      done: Boolean(profile?.full_name && profile?.handle),
      href: '#perfil',
    },
    {
      label: 'Cadastre sua chave PIX',
      description: 'Necessária para receber seus repasses.',
      done: Boolean(profile?.pix_key),
      href: '#perfil',
    },
    {
      label: 'Conecte uma rede social',
      description: 'Valide seu alcance para definir sua comissão.',
      done: integrations.some((i) => i.status === 'connected'),
      href: '#redes-sociais',
    },
    {
      label: 'Crie seu primeiro link',
      description: 'Gere um link rastreável para divulgar.',
      done: links.length > 0,
      href: '/dashboard/links',
    },
  ]

  const allDone = checklist.every((i) => i.done)

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie sua conta e preferências"
        actions={<NotificationBell />}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {!allDone && <SetupChecklist items={checklist} />}

          <Card id="perfil" className="scroll-mt-24 border-line bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-ink-muted" />
                <CardTitle className="text-base font-semibold text-ink">Perfil</CardTitle>
              </div>
              <CardDescription>Suas informações pessoais e chave de recebimento</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettingsForm
                fullName={profile?.full_name ?? ''}
                handle={profile?.handle ?? ''}
                email={user.email ?? ''}
                pixKey={profile?.pix_key ?? ''}
                initials={profile?.avatar_initials ?? '–'}
              />
            </CardContent>
          </Card>

          <Card className="border-line bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-ink-muted" />
                <CardTitle className="text-base font-semibold text-ink">Plano de comissão</CardTitle>
              </div>
              <CardDescription>Sua taxa de comissão atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-10">
                <div>
                  <p className="text-sm text-ink-muted">Taxa de comissão</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">{ratePct}%</p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Método de pagamento</p>
                  <p className="mt-1 font-medium text-ink">PIX</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-ink-subtle">
                Sua taxa acompanha seu status na Tetra Society. Para dúvidas, fale com o time Tetra.
              </p>
            </CardContent>
          </Card>

          <Card id="redes-sociais" className="scroll-mt-24 border-line bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-ink-muted" />
                <CardTitle className="text-base font-semibold text-ink">Redes sociais</CardTitle>
              </div>
              <CardDescription>
                As redes que você usa para divulgar seus links de indicação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionsPanel integrations={integrations} connected={connected} error={error} />
            </CardContent>
          </Card>

          <Card className="border-line bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-ink-muted" />
                <CardTitle className="text-base font-semibold text-ink">Notificações</CardTitle>
              </div>
              <CardDescription>Como você recebe avisos da Tetra</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted">
                Avisos sobre novas campanhas, aprovações e repasses aparecem no sino do topo da página.
                Também enviamos confirmações importantes por e-mail.
              </p>
            </CardContent>
          </Card>

          <Card className="border-line bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-ink-muted" />
                <CardTitle className="text-base font-semibold text-ink">Segurança</CardTitle>
              </div>
              <CardDescription>Proteja sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">Senha de acesso</p>
                  <p className="text-sm text-ink-muted">Gerenciada pela autenticação Tetra</p>
                </div>
                <Button variant="outline" size="sm" disabled className="border-line">
                  Em breve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
