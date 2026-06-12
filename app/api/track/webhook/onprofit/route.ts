import { handleCheckoutWebhook } from '@/lib/webhook-handler'

// Onprofit checkout webhook.
// Configure in Onprofit: webhook URL = https://portal.tetraeducacao.com.br/api/track/webhook/onprofit?token=<ONPROFIT_WEBHOOK_TOKEN>
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(request: Request) {
  return handleCheckoutWebhook(request, { provider: 'onprofit', tokenEnv: 'ONPROFIT_WEBHOOK_TOKEN' })
}
