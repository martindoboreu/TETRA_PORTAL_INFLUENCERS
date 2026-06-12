// Shared (client-safe) metadata for the external platform connectors.
import type { IntegrationProvider } from '@/lib/database.types'

export type ProviderMeta = {
  id: IntegrationProvider
  label: string
  brand: string // brand color for the UI
  metricLabel: string // "seguidores", "inscritos", ...
  description: string
}

export const PROVIDERS: Record<IntegrationProvider, ProviderMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    brand: '#E1306C',
    metricLabel: 'seguidores',
    description: 'Importa seguidores e engajamento do seu perfil profissional.',
  },
  meta: {
    id: 'meta',
    label: 'Facebook (Meta)',
    brand: '#1877F2',
    metricLabel: 'seguidores',
    description: 'Conecta suas páginas do Facebook via Meta Graph API.',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    brand: '#FF0000',
    metricLabel: 'inscritos',
    description: 'Importa inscritos e visualizações do seu canal.',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    brand: '#111111',
    metricLabel: 'seguidores',
    description: 'Conecta sua conta TikTok for Business.',
  },
  google: {
    id: 'google',
    label: 'Google',
    brand: '#4285F4',
    metricLabel: 'audiência',
    description: 'Vincula Google Analytics / Search para atribuição de tráfego.',
  },
}

export const PROVIDER_ORDER: IntegrationProvider[] = ['instagram', 'meta', 'youtube', 'tiktok', 'google']

export function isValidProvider(value: string): value is IntegrationProvider {
  return value in PROVIDERS
}
