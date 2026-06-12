'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CaptionCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3 rounded-xl bg-surface-muted p-3">
      <p className="whitespace-pre-line text-sm text-ink">{text}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand transition-colors hover:text-brand-strong"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copiado!' : 'Copiar legenda'}
      </button>
    </div>
  )
}
