import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApplicationReviewCard } from '@/components/admin/application-review-card'
import { getPendingApplications } from '@/lib/queries/admin-applications'

export const dynamic = 'force-dynamic'

export default async function AdminAprovacoesPage() {
  const applications = await getPendingApplications()

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1b] sm:text-xl">
              Aprovações
            </h1>
            <p className="mt-0.5 hidden text-sm text-[#6B7280] sm:block">
              Revise cadastros pendentes antes de liberar o acesso ao portal
            </p>
          </div>
          <Link
            href="/admin/parceiros?status=pendente"
            className="text-sm font-medium text-[#6B7280] hover:text-[#1d1d1b]"
          >
            Ver na lista de parceiros
          </Link>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1d1d1b]">
              {applications.length === 0
                ? 'Nenhum cadastro pendente'
                : `${applications.length} ${applications.length === 1 ? 'cadastro' : 'cadastros'} aguardando`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#6B7280]">
                Todos os cadastros foram analisados. Novas solicitações aparecerão aqui.
              </p>
            ) : (
              <div>
                {applications.map((app) => (
                  <ApplicationReviewCard key={app.id} application={app} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
