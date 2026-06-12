import { handleCheckoutWebhook } from '@/lib/webhook-handler'

// Digital Manager Guru checkout webhook.
// Configure in Guru: webhook URL = https://portal.tetraeducacao.com.br/api/track/webhook/guru?token=<GURU_WEBHOOK_TOKEN>
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(request: Request) {
  return handleCheckoutWebhook(request, { provider: 'guru', tokenEnv: 'GURU_WEBHOOK_TOKEN' })
}
