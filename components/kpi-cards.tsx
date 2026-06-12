import { StatCard } from '@/components/stat-card'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format'

export interface PartnerKpis {
  cliques: number
  cliques_delta: number
  leads: number
  leads_delta: number
  conversoes: number
  conversoes_delta: number
  taxa_conversao: number
  taxa_conversao_delta: number
  comissao: number
  comissao_delta: number
  a_receber: number
}

interface KPICardsProps {
  data: PartnerKpis
  nextPayoutLabel: string
}

export function KPICards({ data, nextPayoutLabel }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Cliques no link" value={formatNumber(data.cliques)} delta={data.cliques_delta} delay={50} />
      <StatCard label="Leads capturados" value={formatNumber(data.leads)} delta={data.leads_delta} delay={100} />
      <StatCard label="Conversões" value={formatNumber(data.conversoes)} delta={data.conversoes_delta} delay={150} />
      <StatCard
        label="Taxa de conversão"
        value={formatPercentage(data.taxa_conversao)}
        delta={data.taxa_conversao_delta}
        deltaSuffix=" p.p."
        delay={200}
      />
      <StatCard
        label="Comissão (período)"
        value={formatCurrency(data.comissao)}
        delta={data.comissao_delta}
        highlight
        delay={250}
      />
      <StatCard
        label="A receber"
        value={formatCurrency(data.a_receber)}
        note={`Próximo: ${nextPayoutLabel}`}
        delay={300}
      />
    </div>
  )
}
