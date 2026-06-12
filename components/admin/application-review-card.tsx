'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { setPartnerStatus, type AdminActionState } from '@/app/admin/actions'
import { formatDateLong, formatFollowers } from '@/lib/format'
import type { PartnerApplication } from '@/lib/queries/admin-applications'

const INITIAL: AdminActionState = { ok: true, error: null }

const PROVIDER_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  meta: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  google: 'Google',
}

export function ApplicationReviewCard({ application }: { application: PartnerApplication }) {
  const router = useRouter()
  const [approveState, approveAction, approvePending] = useActionState(setPartnerStatus, INITIAL)
  const [denyState, denyAction, denyPending] = useActionState(setPartnerStatus, INITIAL)

  useEffect(() => {
    if (approveState.ok || denyState.ok) router.refresh()
  }, [approveState, denyState, router])

  const pending = approvePending || denyPending

  return (
    <article className="border-b border-[#E5E5E5] py-6 last:border-0">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 border border-[#E5E5E5]">
            <AvatarFallback className="bg-[#1d1d1b] text-sm text-[#f6f6f6]">
              {application.avatar_initials ?? '–'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1b]">
                {application.full_name ?? 'Sem nome'}
              </h2>
              <p className="text-sm text-[#6B7280]">
                {application.email ?? '—'}
                {application.handle ? ` · @${application.handle}` : ''}
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Cadastro em {formatDateLong(application.created_at)}
              </p>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#9CA3AF]">Rede principal</dt>
                <dd className="font-medium text-[#1d1d1b]">
                  {application.primary_social
                    ? `${application.primary_social}${application.follower_count ? ` · ${formatFollowers(application.follower_count)}` : ''}`
                    : application.follower_count
                      ? formatFollowers(application.follower_count)
                      : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[#9CA3AF]">Chave PIX</dt>
                <dd className="font-medium text-[#1d1d1b]">{application.pix_key ?? '—'}</dd>
              </div>
              {application.application_pitch && (
                <div className="sm:col-span-2">
                  <dt className="text-[#9CA3AF]">Sobre o público</dt>
                  <dd className="text-[#1d1d1b]">{application.application_pitch}</dd>
                </div>
              )}
              <div>
                <dt className="text-[#9CA3AF]">Redes conectadas</dt>
                <dd className="font-medium text-[#1d1d1b]">
                  {application.integrations.length === 0
                    ? 'Nenhuma ainda'
                    : application.integrations
                        .map(
                          (i) =>
                            `${PROVIDER_LABEL[i.provider] ?? i.provider} ${i.external_handle ?? ''}`
                        )
                        .join(' · ')}
                </dd>
              </div>
            </dl>

            <Link
              href={`/admin/parceiros/${application.id}`}
              className="text-sm font-medium text-[#1d1d1b] underline underline-offset-2"
            >
              Ver ficha completa
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <form action={approveAction}>
            <input type="hidden" name="partner_id" value={application.id} />
            <input type="hidden" name="status" value="ativo" />
            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-[#1d1d1b] text-white hover:bg-black sm:w-[140px]"
            >
              {approvePending ? 'Aprovando...' : 'Aprovar'}
            </Button>
          </form>
          <form action={denyAction}>
            <input type="hidden" name="partner_id" value={application.id} />
            <input type="hidden" name="status" value="inativo" />
            <Button
              type="submit"
              variant="outline"
              disabled={pending}
              className="w-full border-[#E5E5E5] sm:w-[140px]"
            >
              {denyPending ? 'Recusando...' : 'Recusar'}
            </Button>
          </form>
        </div>
      </div>
      {(approveState.error || denyState.error) && (
        <p className="mt-3 text-sm text-[#B91C1C]">{approveState.error ?? denyState.error}</p>
      )}
    </article>
  )
}
