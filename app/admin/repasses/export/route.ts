import { NextResponse } from 'next/server'
import { getPartnerRollup, requireAdmin } from '@/lib/queries/admin'
import { resolveRange } from '@/lib/queries/range'

export const dynamic = 'force-dynamic'

function csvEscape(value: string | number): string {
  const s = String(value)
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const rollup = await getPartnerRollup(resolveRange('all'))

  const header = [
    'Parceiro',
    'Handle',
    'Nível de influência',
    'Taxa de comissão',
    'Status',
    'Cliques',
    'Conversões',
    'Comissão total',
    'A repassar',
  ]

  const lines = [header.map(csvEscape).join(',')]
  for (const p of rollup) {
    lines.push(
      [
        p.full_name ?? 'Parceiro',
        p.handle ? `@${p.handle}` : '',
        p.tier ?? '—',
        `${Math.round(p.commission_rate * 100)}%`,
        p.status,
        p.cliques,
        p.conversoes,
        Number(p.comissao).toFixed(2),
        Number(p.a_receber).toFixed(2),
      ]
        .map(csvEscape)
        .join(',')
    )
  }

  // BOM so Excel (pt-BR) opens UTF-8 correctly.
  const csv = '\uFEFF' + lines.join('\r\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="repasses-tetra-${date}.csv"`,
    },
  })
}
