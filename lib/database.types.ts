// Hand-written types for the Tetra "Portal de Parceiros" schema.
// Mirror of supabase/migrations/*.sql — keep in sync when the schema changes.
// (You can also regenerate with `supabase gen types typescript --local`.)

export type Role = 'admin' | 'partner'
// Influence level labels are data-driven (admin-editable in influence_levels),
// so `tier` is stored as free text. These are the seeded defaults.
export type InfluenceLevel = 'Iniciante' | 'Criador' | 'Influenciador' | 'Estrela' | 'Elite'
export type ProfileStatus = 'ativo' | 'pendente' | 'inativo'
export type LinkStatus = 'active' | 'paused'
export type ConversionStatus = 'pago' | 'confirmado' | 'reembolsado'
export type PayoutStatus = 'pendente' | 'pago'
export type IntegrationProvider = 'meta' | 'instagram' | 'google' | 'youtube' | 'tiktok'
export type IntegrationStatus = 'connected' | 'disconnected'
export type CampaignStatus = 'rascunho' | 'ativa' | 'encerrada'
export type CampaignParticipantStatus = 'convidado' | 'aceito' | 'entregue'
export type AssetCategory = 'criativo' | 'legenda' | 'guia' | 'exemplo'
export type NotificationType = 'info' | 'payout' | 'campaign' | 'approval' | 'milestone'
export type SocietyTierKey = 'select' | 'signature' | 'circle' | 'council'

type ProfilesRow = {
  id: string
  role: Role
  full_name: string | null
  handle: string | null
  avatar_initials: string | null
  tier: string | null
  commission_rate: number
  follower_count: number
  pix_key: string | null
  status: ProfileStatus
  onboarding_completed: boolean
  society_tier: SocietyTierKey
  created_at: string
}

type SocietyTiersRow = {
  id: number
  key: SocietyTierKey
  name: string
  description: string
  commission_rate: number
  invite_only: boolean
  sort_order: number
}

type PartnerEvaluationsRow = {
  partner_id: string
  approved_content_count: number
  compliance_score: number
  content_quality_score: number
  responsiveness_score: number
  notes: string | null
  updated_at: string
}

type InfluenceLevelsRow = {
  id: number
  label: string
  min_followers: number
  max_followers: number | null
  commission_rate: number
  sort_order: number
}

type RewardTiersRow = {
  id: number
  label: string
  prize: string
  threshold_conversions: number
  icon: string | null
  sort_order: number
}

type IntegrationsRow = {
  id: string
  partner_id: string
  provider: IntegrationProvider
  status: IntegrationStatus
  external_handle: string | null
  external_account_id: string | null
  follower_count: number
  access_token: string | null
  refresh_token: string | null
  scope: string | null
  connected_at: string
  last_synced_at: string | null
}

type LinksRow = {
  id: string
  partner_id: string
  label: string
  slug: string
  discount_code: string | null
  status: LinkStatus
  created_at: string
}

type ClicksRow = {
  id: string
  link_id: string
  partner_id: string
  created_at: string
}

type LeadsRow = {
  id: string
  partner_id: string
  link_id: string | null
  buyer_masked: string | null
  created_at: string
}

type ConversionsRow = {
  id: string
  partner_id: string
  link_id: string | null
  buyer_masked: string
  course: string
  amount: number
  commission: number
  status: ConversionStatus
  payout_id: string | null
  created_at: string
}

type PayoutsRow = {
  id: string
  partner_id: string
  amount: number
  method: string
  status: PayoutStatus
  reference_period: string | null
  paid_at: string | null
  created_at: string
}

type ProgramSettingsRow = {
  id: number
  default_commission_rate: number
  next_payout_date: string | null
  reward_cycle_start: string
  reward_cycle_label: string
  updated_at: string
}

type CampaignsRow = {
  id: string
  title: string
  subtitle: string | null
  brief: string | null
  commission_note: string | null
  content_requirements: string | null
  reward_highlight: string | null
  deadline: string | null
  status: CampaignStatus
  sort_order: number
  created_at: string
  updated_at: string
}

type CampaignParticipantsRow = {
  id: string
  campaign_id: string
  partner_id: string
  status: CampaignParticipantStatus
  created_at: string
  updated_at: string
}

type AssetsRow = {
  id: string
  category: AssetCategory
  title: string
  description: string | null
  file_url: string | null
  caption_text: string | null
  course: string | null
  format: string | null
  sort_order: number
  created_at: string
}

type NotificationsRow = {
  id: string
  partner_id: string
  type: NotificationType
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow
        Insert: Partial<ProfilesRow> & { id: string }
        Update: Partial<ProfilesRow>
        Relationships: []
      }
      links: {
        Row: LinksRow
        Insert: Omit<LinksRow, 'id' | 'created_at' | 'status'> & {
          id?: string
          status?: LinkStatus
          created_at?: string
        }
        Update: Partial<LinksRow>
        Relationships: []
      }
      clicks: {
        Row: ClicksRow
        Insert: Omit<ClicksRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<ClicksRow>
        Relationships: []
      }
      leads: {
        Row: LeadsRow
        Insert: Omit<LeadsRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<LeadsRow>
        Relationships: []
      }
      conversions: {
        Row: ConversionsRow
        Insert: Omit<ConversionsRow, 'id' | 'created_at' | 'status' | 'payout_id'> & {
          id?: string
          status?: ConversionStatus
          payout_id?: string | null
          created_at?: string
        }
        Update: Partial<ConversionsRow>
        Relationships: []
      }
      payouts: {
        Row: PayoutsRow
        Insert: Omit<PayoutsRow, 'id' | 'created_at' | 'method' | 'status'> & {
          id?: string
          method?: string
          status?: PayoutStatus
          created_at?: string
        }
        Update: Partial<PayoutsRow>
        Relationships: []
      }
      program_settings: {
        Row: ProgramSettingsRow
        Insert: Partial<ProgramSettingsRow>
        Update: Partial<ProgramSettingsRow>
        Relationships: []
      }
      influence_levels: {
        Row: InfluenceLevelsRow
        Insert: Partial<InfluenceLevelsRow> & { id: number }
        Update: Partial<InfluenceLevelsRow>
        Relationships: []
      }
      reward_tiers: {
        Row: RewardTiersRow
        Insert: Partial<RewardTiersRow> & { id: number }
        Update: Partial<RewardTiersRow>
        Relationships: []
      }
      integrations: {
        Row: IntegrationsRow
        Insert: {
          id?: string
          partner_id: string
          provider: IntegrationProvider
          status?: IntegrationStatus
          external_handle?: string | null
          external_account_id?: string | null
          follower_count?: number
          access_token?: string | null
          refresh_token?: string | null
          scope?: string | null
          connected_at?: string
          last_synced_at?: string | null
        }
        Update: Partial<IntegrationsRow>
        Relationships: []
      }
      campaigns: {
        Row: CampaignsRow
        Insert: Omit<CampaignsRow, 'id' | 'created_at' | 'updated_at' | 'status' | 'sort_order'> & {
          id?: string
          status?: CampaignStatus
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<CampaignsRow>
        Relationships: []
      }
      campaign_participants: {
        Row: CampaignParticipantsRow
        Insert: Omit<CampaignParticipantsRow, 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string
          status?: CampaignParticipantStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<CampaignParticipantsRow>
        Relationships: []
      }
      assets: {
        Row: AssetsRow
        Insert: Omit<AssetsRow, 'id' | 'created_at' | 'sort_order'> & {
          id?: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<AssetsRow>
        Relationships: []
      }
      notifications: {
        Row: NotificationsRow
        Insert: Omit<NotificationsRow, 'id' | 'created_at' | 'type' | 'read_at'> & {
          id?: string
          type?: NotificationType
          read_at?: string | null
          created_at?: string
        }
        Update: Partial<NotificationsRow>
        Relationships: []
      }
      society_tiers: {
        Row: SocietyTiersRow
        Insert: Partial<SocietyTiersRow> & { id: number }
        Update: Partial<SocietyTiersRow>
        Relationships: []
      }
      partner_evaluations: {
        Row: PartnerEvaluationsRow
        Insert: Partial<PartnerEvaluationsRow> & { partner_id: string }
        Update: Partial<PartnerEvaluationsRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      partner_kpis_in_range: {
        Args: { p_partner: string; p_from: string; p_to: string }
        Returns: {
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
        }[]
      }
      partner_chart_in_range: {
        Args: { p_partner: string; p_from: string; p_to: string; p_bucket?: string }
        Returns: { bucket: string; cliques: number; conversoes: number }[]
      }
      partner_funnel_in_range: {
        Args: { p_partner: string; p_from: string; p_to: string }
        Returns: { cliques: number; leads: number; matriculas: number; pagos: number }[]
      }
      partner_link_performance_in_range: {
        Args: { p_partner: string; p_from: string; p_to: string }
        Returns: {
          link_id: string
          label: string
          slug: string
          cliques: number
          leads: number
          conversoes: number
          taxa_conversao: number
          comissao: number
        }[]
      }
      admin_program_kpis_in_range: {
        Args: { p_from: string; p_to: string }
        Returns: {
          cliques: number
          leads: number
          conversoes: number
          taxa_conversao: number
          comissao_total: number
          a_repassar: number
          parceiros_ativos: number
        }[]
      }
      admin_chart_in_range: {
        Args: { p_from: string; p_to: string; p_bucket?: string }
        Returns: { bucket: string; cliques: number; conversoes: number }[]
      }
      admin_partner_rollup_in_range: {
        Args: { p_from: string; p_to: string }
        Returns: {
          partner_id: string
          full_name: string | null
          handle: string | null
          avatar_initials: string | null
          tier: string | null
          commission_rate: number
          status: ProfileStatus
          cliques: number
          conversoes: number
          comissao: number
          a_receber: number
        }[]
      }
      admin_mark_partner_paid: {
        Args: { p_partner: string; p_reference_period?: string | null }
        Returns: { payout_id: string; amount: number }[]
      }
      influence_level_for: {
        Args: { p_followers: number }
        Returns: InfluenceLevelsRow
      }
      partner_reward_progress: {
        Args: { p_partner: string }
        Returns: { conversoes_ciclo: number; cycle_start: string; cycle_label: string }[]
      }
      admin_reward_standings: {
        Args: Record<string, never>
        Returns: {
          partner_id: string
          full_name: string | null
          handle: string | null
          avatar_initials: string | null
          conversoes_ciclo: number
        }[]
      }
      reapply_influence_rates: { Args: Record<string, never>; Returns: undefined }
      reapply_society_rates: { Args: Record<string, never>; Returns: undefined }
      current_user_role: { Args: Record<string, never>; Returns: Role }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
  }
}
