// Compliance & Segurança — product constants for the partner-facing rules.
// This is the trust surface of the program: disclosure, claims and approval
// requirements every partner must follow when representing the Tetra brand.

export interface ComplianceRule {
  id: string
  title: string
  detail: string
}

// Publicity disclosure obligations (CONAR guidance for influencer marketing).
export const DISCLOSURE_RULES: ComplianceRule[] = [
  {
    id: 'tag-publi',
    title: 'Identifique a publicidade',
    detail:
      'Todo conteúdo com seu link ou cupom deve trazer identificação clara de publicidade: #publi, #parceriacomercial ou o recurso de parceria paga da plataforma.',
  },
  {
    id: 'visible',
    title: 'Disclosure visível, não escondido',
    detail:
      'A identificação precisa aparecer no início da legenda ou na própria peça — nunca apenas no final, em bloco de hashtags ou em texto reduzido.',
  },
  {
    id: 'stories',
    title: 'Stories e vídeos curtos',
    detail:
      'Em formatos efêmeros, a identificação deve estar em todos os cards/cortes que contêm a oferta, não apenas no primeiro.',
  },
  {
    id: 'ai-content',
    title: 'Conteúdo gerado por IA',
    detail:
      'Peças criadas ou alteradas substancialmente por IA (voz, avatar, imagem) devem declarar o uso de IA. Não simule depoimentos reais de alunos com IA.',
  },
]

// What partners may say about Tetra courses — and what they may not.
export const APPROVED_CLAIMS: string[] = [
  'Cursos com certificado reconhecido e tutoria ativa',
  'Conteúdo prático, voltado ao mercado de trabalho',
  'Acesso por 12 meses com atualizações incluídas',
  'Garantia de 7 dias prevista no Código de Defesa do Consumidor',
  'Parcelamento disponível no checkout oficial',
]

export const FORBIDDEN_CLAIMS: string[] = [
  'Promessa de emprego, renda ou aprovação garantida',
  'Resultados financeiros específicos ("ganhe R$ X em Y dias")',
  'Comparações depreciativas nominais com concorrentes',
  'Descontos ou condições que não estão no checkout oficial',
  'Depoimentos inventados ou gerados por IA como se fossem reais',
]

// What the team checks before a campaign piece goes live.
export const CAMPAIGN_APPROVAL_STEPS: ComplianceRule[] = [
  {
    id: 'brief',
    title: 'Siga o briefing da campanha',
    detail: 'Cada campanha tem claims, oferta e período definidos. Use apenas o que está no briefing.',
  },
  {
    id: 'review',
    title: 'Envie para revisão prévia',
    detail:
      'Peças de campanhas prioritárias passam por revisão da equipe antes da publicação. O retorno acontece em até 2 dias úteis.',
  },
  {
    id: 'tracking',
    title: 'Use seu link ou cupom oficial',
    detail:
      'A atribuição (e a sua comissão) depende do link rastreável ou cupom gerados no portal. Links encurtados por fora quebram o rastreio.',
  },
]
