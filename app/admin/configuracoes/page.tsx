import { Settings, Landmark, Bell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/admin/settings-form'
import { SocietyTiersForm } from '@/components/admin/society-tiers-form'
import { getAdminSettings } from '@/lib/queries/admin'
import { getSocietyTiers } from '@/lib/queries/society'

export const dynamic = 'force-dynamic'

export default async function AdminConfiguracoesPage() {
  const [settings, tiers] = await Promise.all([
    getAdminSettings(),
    getSocietyTiers(),
  ])
  const defaultRatePct = Math.round((settings?.default_commission_rate ?? 0.3) * 100)
  const nextPayoutDate = settings?.next_payout_date ?? null

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1b] sm:text-xl">Configurações</h1>
            <p className="mt-0.5 hidden text-sm text-[#6B7280] sm:block">Parâmetros gerais do programa</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#6B7280]" />
                <CardTitle className="text-base font-semibold text-[#1d1d1b]">Programa</CardTitle>
              </div>
              <CardDescription>Taxa padrão de novos parceiros e calendário de repasses</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm defaultRatePct={defaultRatePct} nextPayoutDate={nextPayoutDate} />
            </CardContent>
          </Card>

          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-[#6B7280]" />
                <CardTitle className="text-base font-semibold text-[#1d1d1b]">Tetra Society</CardTitle>
              </div>
              <CardDescription>
                A comissão por conversão de cada status. Os convites para cada status são feitos manualmente
                na página de Parceiros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocietyTiersForm tiers={tiers} />
            </CardContent>
          </Card>

          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#6B7280]" />
                <CardTitle className="text-base font-semibold text-[#1d1d1b]">Notificações</CardTitle>
              </div>
              <CardDescription>Alertas automáticos do programa</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#6B7280]">
                Os disparos automáticos (novos parceiros, repasses confirmados) serão configuráveis aqui em
                uma próxima etapa.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
