'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReferralCardProps {
  /** Compact display form, e.g. "tetraeducacao.com.br/r/abc". */
  primaryLink: string | null
  primaryCode: string | null
  commissionRatePct: number
}

export function ReferralCard({ primaryLink, primaryCode, commissionRatePct }: ReferralCardProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const handleCopyLink = async () => {
    if (!primaryLink) return
    // Copy a fully-qualified URL even though we display the compact form.
    const full = primaryLink.startsWith('http') ? primaryLink : `https://${primaryLink}`
    await navigator.clipboard.writeText(full)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleCopyCode = async () => {
    if (!primaryCode) return
    await navigator.clipboard.writeText(primaryCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  return (
    <div className="animate-fade-slide-up rounded-2xl border border-line bg-white p-4 shadow-[var(--elevation-card)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 sm:px-4 sm:py-2.5">
              <span className="truncate font-mono text-xs text-ink sm:text-sm">
                {primaryLink ?? 'Crie um link para começar'}
              </span>
            </div>
            <Button
              onClick={handleCopyLink}
              disabled={!primaryLink}
              size="sm"
              className="w-full bg-brand text-white hover:bg-brand-strong sm:w-auto"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          {primaryCode && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-muted">Cupom:</span>
              <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 sm:px-4 sm:py-2.5">
                <span className="font-mono text-xs font-medium text-ink sm:text-sm">
                  {primaryCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-ink-muted transition-colors hover:text-ink"
                aria-label="Copiar cupom"
              >
                {codeCopied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-ink-muted sm:text-sm">
          Comissão de {commissionRatePct}% em todas as vendas atribuídas.
        </p>
      </div>
    </div>
  )
}
