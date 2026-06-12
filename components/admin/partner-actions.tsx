'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Check, Pencil, Send, ClipboardCheck, UserRound, Megaphone, PauseCircle, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  setPartnerStatus,
  updatePartnerFollowers,
  inviteToTier,
  updatePartnerEvaluation,
  type AdminActionState,
} from '@/app/admin/actions'
import { SOCIETY_TIERS, tierConfig, normalizeTierKey } from '@/lib/society'
import type { SocietyTierKey } from '@/lib/database.types'

const INITIAL: AdminActionState = { ok: true, error: null }

export interface PartnerEvaluationInput {
  approved_content_count: number
  compliance_score: number
  content_quality_score: number
  responsiveness_score: number
  notes: string | null
}

interface PartnerActionsProps {
  partnerId: string
  status: 'ativo' | 'pendente' | 'inativo'
  societyTier: SocietyTierKey | string | null
  followerCount: number
  commissionRatePct: number
  /** Pass the current evaluation to enable the "Avaliação do parceiro" editor. */
  evaluation?: PartnerEvaluationInput | null
}

export function PartnerActions({
  partnerId,
  status,
  societyTier,
  followerCount,
  commissionRatePct,
  evaluation,
}: PartnerActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [evalOpen, setEvalOpen] = useState(false)
  const currentTier = normalizeTierKey(typeof societyTier === 'string' ? societyTier : null)

  const [statusState, statusAction] = useActionState(setPartnerStatus, INITIAL)
  const [editState, editAction] = useActionState(updatePartnerFollowers, INITIAL)
  const [inviteState, inviteAction] = useActionState(inviteToTier, INITIAL)
  const [evalState, evalAction] = useActionState(updatePartnerEvaluation, INITIAL)

  useEffect(() => {
    if (statusState.ok && statusState.error === null) router.refresh()
  }, [statusState, router])

  useEffect(() => {
    if (inviteState.ok && inviteState.error === null) router.refresh()
  }, [inviteState, router])

  useEffect(() => {
    if (editState.ok && editState.error === null && editOpen) {
      setEditOpen(false)
      router.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState])

  useEffect(() => {
    if (evalState.ok && evalState.error === null && evalOpen) {
      setEvalOpen(false)
      router.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evalState])

  return (
    <div className="flex items-center justify-end gap-2">
      {status === 'pendente' && (
        <form action={statusAction}>
          <input type="hidden" name="partner_id" value={partnerId} />
          <input type="hidden" name="status" value="ativo" />
          <Button type="submit" size="sm" className="h-8 bg-[#0FB5A6] text-white hover:bg-[#0FB5A6]/90">
            <Check className="mr-1 h-3.5 w-3.5" />
            Aprovar
          </Button>
        </form>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 border-[#E5E5E5]" aria-label="Ações">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem asChild>
            <Link href={`/admin/parceiros/${partnerId}`}>
              <UserRound className="mr-2 h-4 w-4" />
              Ver perfil
            </Link>
          </DropdownMenuItem>
          {evaluation !== undefined && (
            <DropdownMenuItem onSelect={() => setEvalOpen(true)}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Avaliação do parceiro
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/admin/campanhas">
              <Megaphone className="mr-2 h-4 w-4" />
              Convidar para campanha
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Ajustar alcance
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-medium text-[#9CA3AF]">Status na Tetra Society</DropdownMenuLabel>
          {SOCIETY_TIERS.map((tier) => {
            const isCurrent = tier.key === currentTier
            return (
              <form key={tier.key} action={inviteAction}>
                <input type="hidden" name="partner_id" value={partnerId} />
                <input type="hidden" name="society_tier" value={tier.key} />
                <button
                  type="submit"
                  disabled={isCurrent}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-[#f6f6f6] disabled:cursor-default disabled:opacity-100"
                >
                  {isCurrent ? (
                    <Check className="h-3.5 w-3.5 text-[#0FB5A6]" />
                  ) : (
                    <Send className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  )}
                  <span className={isCurrent ? 'font-medium text-[#1d1d1b]' : 'text-[#1d1d1b]'}>
                    {isCurrent ? `${tier.name} · atual` : `Convidar · ${tier.name}`}
                  </span>
                </button>
              </form>
            )
          })}

          <DropdownMenuSeparator />
          {status !== 'ativo' && (
            <form action={statusAction}>
              <input type="hidden" name="partner_id" value={partnerId} />
              <input type="hidden" name="status" value="ativo" />
              <button type="submit" className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-[#f6f6f6]">
                <PlayCircle className="mr-2 h-4 w-4 text-[#0FB5A6]" />
                Reativar parceiro
              </button>
            </form>
          )}
          {status !== 'inativo' && (
            <form action={statusAction}>
              <input type="hidden" name="partner_id" value={partnerId} />
              <input type="hidden" name="status" value="inativo" />
              <button type="submit" className="flex w-full items-center px-2 py-1.5 text-sm text-[#B91C1C] hover:bg-[#f6f6f6]">
                <PauseCircle className="mr-2 h-4 w-4" />
                Pausar parceiro
              </button>
            </form>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {inviteState.error && <span className="text-xs text-[#EF4444]">{inviteState.error}</span>}

      {/* Follower / reach editor — informational only. */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar alcance</DialogTitle>
            <DialogDescription>
              O número de seguidores é apenas informativo. A comissão segue o status na Tetra Society.
            </DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            <input type="hidden" name="partner_id" value={partnerId} />
            <div className="space-y-2">
              <Label htmlFor={`followers-${partnerId}`}>Seguidores (total)</Label>
              <Input
                id={`followers-${partnerId}`}
                name="follower_count"
                type="number"
                min={0}
                step={1}
                defaultValue={followerCount}
                className="border-[#E5E5E5]"
              />
            </div>
            <div className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-sm text-[#6B7280]">
              Status atual: <span className="font-medium text-[#1d1d1b]">{tierConfig(currentTier).name}</span> · {commissionRatePct}% por conversão
            </div>
            {editState.error && <p className="text-sm text-[#EF4444]">{editState.error}</p>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-[#E5E5E5]">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-[#0FB5A6] text-white hover:bg-[#0FB5A6]/90">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Evaluation editor — admin-scored invitation criteria. */}
      {evaluation !== undefined && (
        <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Avaliação do parceiro</DialogTitle>
              <DialogDescription>
                Critérios qualitativos considerados ao estender um convite. Notas de 0 a 100.
              </DialogDescription>
            </DialogHeader>
            <form action={evalAction} className="space-y-4">
              <input type="hidden" name="partner_id" value={partnerId} />
              <div className="space-y-2">
                <Label htmlFor={`approved-${partnerId}`}>Conteúdos aprovados</Label>
                <Input
                  id={`approved-${partnerId}`}
                  name="approved_content_count"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={evaluation?.approved_content_count ?? 0}
                  className="border-[#E5E5E5]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`compliance-${partnerId}`} className="text-xs">Conformidade</Label>
                  <Input id={`compliance-${partnerId}`} name="compliance_score" type="number" min={0} max={100} defaultValue={evaluation?.compliance_score ?? 0} className="border-[#E5E5E5]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`quality-${partnerId}`} className="text-xs">Qualidade</Label>
                  <Input id={`quality-${partnerId}`} name="content_quality_score" type="number" min={0} max={100} defaultValue={evaluation?.content_quality_score ?? 0} className="border-[#E5E5E5]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`resp-${partnerId}`} className="text-xs">Responsividade</Label>
                  <Input id={`resp-${partnerId}`} name="responsiveness_score" type="number" min={0} max={100} defaultValue={evaluation?.responsiveness_score ?? 0} className="border-[#E5E5E5]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`notes-${partnerId}`}>Notas internas</Label>
                <Input id={`notes-${partnerId}`} name="notes" type="text" defaultValue={evaluation?.notes ?? ''} className="border-[#E5E5E5]" />
              </div>
              {evalState.error && <p className="text-sm text-[#EF4444]">{evalState.error}</p>}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="border-[#E5E5E5]">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="bg-[#0FB5A6] text-white hover:bg-[#0FB5A6]/90">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
