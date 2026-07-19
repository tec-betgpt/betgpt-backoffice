export type CampaignType = "broadcast";
export type CampaignChannel = "sms";

export type CampaignStatus =
  | "draft"
  | "validating"
  | "validation_failed"
  | "validated"
  | "prepared"
  | "running"
  | "paused"
  | "completed"
  | "canceled"
  | "archived";

export type CampaignAudienceMode = "none" | "fixed" | "dynamic";
export type CampaignScheduleType = "immediate" | "scheduled" | "recurring";
export type CampaignRecurrenceFrequency = "daily" | "weekly" | "monthly";
export type CampaignWarmupIncrementType = "fixed" | "percentage";
export type CampaignWarmupIntervalUnit = "hour" | "day";
export type CampaignLinkStatus = "detected" | "linked" | "ignored" | "invalid" | string;

export type CampaignMetadata = Record<string, unknown>;

export type CampaignMessageLike = {
  field: string;
  message: string;
};

export type CampaignProjectSummary = {
  id: number;
  name: string;
  uuid?: string | null;
};

export type CampaignUserProjectGroupSummary = {
  id: number;
  name: string;
};

export type CampaignUserSummary = {
  id: number;
  service_id?: number | null;
  language_id?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  email_verified_at?: string | null;
  debit_in?: string | null;
  day_to_debit?: number | null;
  expires_on?: string | null;
  is_available?: number | boolean | null;
  document_number?: string | null;
  kind_person?: string | null;
  asaas_costumer?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  initials?: string | null;
  name?: string | null;
};

export type CampaignWizardIssue = CampaignMessageLike;

export type CampaignWizardStepKey =
  | "channels"
  | "message"
  | "links"
  | "audience"
  | "schedule"
  | "delivery_windows"
  | "warmup";

export type CampaignWizardStep = {
  key: CampaignWizardStepKey;
  label: string;
  status: "missing" | "partial" | "valid";
  filled_fields: string[];
  pending_fields: string[];
  issues: CampaignWizardIssue[];
  is_optional?: boolean;
  is_applicable?: boolean;
  is_enabled?: boolean;
  summary?: string;
  detected_urls?: number;
  tracked_links?: number;
  audience_mode?: CampaignAudienceMode | null;
  apply_protection_list?: boolean;
  schedule_type?: CampaignScheduleType | null;
  active_windows?: number;
};

export type CampaignConfigurationProgress = {
  status: "missing" | "partial" | "valid";
  completed_steps: number;
  missing_steps: number;
  total_steps: number;
  steps: CampaignWizardStep[];
};

export type CampaignSingleStageConfigPayload = {
  target_audience_id?: number | null;
  audience_mode?: CampaignAudienceMode;
  apply_protection_list?: boolean;
  apply_opt_out?: boolean;
  apply_suppression?: boolean;
  daily_recipient_cap?: number | null;
  total_recipient_cap?: number | null;
  eligibility_rules?: CampaignMetadata | null;
  metadata?: CampaignMetadata | null;
};

export type CampaignMessagePayload = {
  channel?: CampaignChannel;
  locale?: string | null;
  body?: string | null;
  character_count?: number;
  sms_segments_count?: number;
  detected_links?: string[];
  variables?: string[];
  metadata?: CampaignMetadata | null;
};

export type CampaignLinkPayload = {
  id?: number | null;
  campaign_message_id?: number | null;
  link_id?: number | null;
  original_url?: string | null;
  placeholder_key?: string | null;
  position?: number | null;
  status?: CampaignLinkStatus;
  utm_context?: CampaignMetadata | null;
  metadata?: CampaignMetadata | null;
};

export type CampaignSchedulePayload = {
  schedule_type?: CampaignScheduleType;
  timezone?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  respect_delivery_windows?: boolean;
  metadata?: CampaignMetadata | null;
};

export type CampaignDeliveryWindowPayload = {
  id?: number | null;
  day_of_week?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
};

export type CampaignRecurrencePolicyPayload = {
  is_enabled?: boolean;
  frequency?: CampaignRecurrenceFrequency;
  interval?: number | null;
  days_of_week?: number[];
  days_of_month?: number[];
  repeat_until?: string | null;
  max_occurrences?: number | null;
  metadata?: CampaignMetadata | null;
};

export type CampaignWarmupPolicyPayload = {
  is_enabled?: boolean;
  initial_limit?: number | null;
  increment_amount?: number | null;
  increment_type?: CampaignWarmupIncrementType;
  interval_unit?: CampaignWarmupIntervalUnit;
  interval_value?: number | null;
  max_limit?: number | null;
  metadata?: CampaignMetadata | null;
};

export type CampaignStorePayload = {
  project_id: number;
  name: string;
  description?: string | null;
  type?: CampaignType;
  channel?: CampaignChannel;
  metadata?: CampaignMetadata | null;
  single_stage_config?: CampaignSingleStageConfigPayload | null;
  message?: CampaignMessagePayload | null;
  messages?: CampaignMessagePayload[];
  links?: CampaignLinkPayload[];
  schedule?: CampaignSchedulePayload | null;
  delivery_windows?: CampaignDeliveryWindowPayload[];
  recurrence_policy?: CampaignRecurrencePolicyPayload | null;
  warmup_policy?: CampaignWarmupPolicyPayload | null;
};

export type CampaignUpdatePayload = Partial<Omit<CampaignStorePayload, "project_id">>;

export type CampaignListParams = {
  filter_id?: string | null;
  project_id?: number | null;
  status?: CampaignStatus | null;
  channel?: CampaignChannel | null;
  type?: CampaignType | null;
  search?: string | null;
  per_page?: number | null;
  page?: number | null;
};

export type CampaignListSchedule = {
  id: number;
  schedule_type: CampaignScheduleType | null;
  timezone: string | null;
  starts_at: string | null;
  ends_at: string | null;
  respect_delivery_windows: boolean;
};

export type CampaignListItem = {
  id: number;
  uuid: string;
  project_id: number;
  user_project_group_id: number | null;
  created_by: number | CampaignUserSummary | null;
  updated_by: number | CampaignUserSummary | null;
  name: string;
  description: string | null;
  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;
  validated_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  project?: CampaignProjectSummary | null;
  user_project_group?: CampaignUserProjectGroupSummary | null;
  created_by_user?: CampaignUserSummary | null;
  updated_by_user?: CampaignUserSummary | null;
  schedule?: CampaignListSchedule | null;
};

export type CampaignListResponse = {
  current_page: number;
  data: CampaignListItem[];
  per_page: number;
  total: number;
  last_page: number;
};

export type CampaignSingleStageConfig = CampaignSingleStageConfigPayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  target_audience?: unknown | null;
};

export type CampaignMessage = CampaignMessagePayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  links?: CampaignLink[];
};

export type CampaignLink = CampaignLinkPayload & {
  id?: number | null;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type CampaignSchedule = CampaignSchedulePayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type CampaignDeliveryWindow = CampaignDeliveryWindowPayload & {
  id?: number | null;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type CampaignRecurrencePolicy = CampaignRecurrencePolicyPayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type CampaignWarmupPolicy = CampaignWarmupPolicyPayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type CampaignDetail = {
  id: number;
  uuid: string;
  project_id: number;
  user_project_group_id: number | null;
  created_by: CampaignUserSummary | number | null;
  updated_by: CampaignUserSummary | number | null;
  name: string;
  description: string | null;
  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;
  metadata: CampaignMetadata | null;
  validated_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  project?: CampaignProjectSummary | null;
  user_project_group?: CampaignUserProjectGroupSummary | null;
  created_by_user?: CampaignUserSummary | null;
  updated_by_user?: CampaignUserSummary | null;
  single_stage_config?: CampaignSingleStageConfig | null;
  messages?: CampaignMessage[];
  links?: CampaignLink[];
  schedule?: CampaignSchedule | null;
  delivery_windows?: CampaignDeliveryWindow[];
  recurrence_policy?: CampaignRecurrencePolicy | null;
  warmup_policy?: CampaignWarmupPolicy | null;
  configuration_progress?: CampaignConfigurationProgress | null;
};

export type CampaignSectionMessages = Record<string, CampaignMessageLike[]>;

export type CampaignPreLaunchChecklistItem = {
  key:
    | "audience"
    | "message"
    | "links"
    | "schedule"
    | "delivery_windows"
    | "warmup"
    | "financial";
  label: string;
  status: "valid" | "warning" | "invalid";
  blocking: boolean;
  messages: string[];
};

export type CampaignValidationResponse = {
  valid: boolean;
  status: "valid" | "invalid";
  configuration_progress: CampaignConfigurationProgress | null;
  pre_launch_checklist: CampaignPreLaunchChecklistItem[];
  errors: CampaignSectionMessages;
  warnings: CampaignSectionMessages;
};

export type CampaignEstimateSectionMessage = CampaignMessageLike;

export type CampaignEstimateResponse = {
  campaign_id: number;
  status: "estimated" | "blocked";
  can_continue: boolean;
  estimated_at: string;
  audience: {
    mode: CampaignAudienceMode | null;
    target_audience_id: number | null;
    target_audience_name: string | null;
    source:
      | "missing"
      | "target_audience_results"
      | "audience_query_builder"
      | "target_audiences.players";
    total: number;
    with_phone: number;
    without_phone: number;
    protected: number;
    suppressed: number;
    opted_out: number;
    eligible: number;
    estimated_recipients: number;
    daily_recipient_cap: number | null;
    total_recipient_cap: number | null;
  };
  message: {
    message_id: number | null;
    character_count: number;
    sms_segments_per_recipient: number;
    estimated_messages: number;
    estimated_sms_segments: number;
  };
  links: {
    detected_urls: number;
    campaign_links: number;
    tracked_links: number;
    untracked_links: number;
  };
  schedule: {
    schedule_type: CampaignScheduleType | null;
    timezone: string | null;
    starts_at: string | null;
    ends_at: string | null;
    respect_delivery_windows: boolean;
    active_delivery_windows: number;
  };
  warmup: {
    enabled: boolean;
    initial_limit: number | null;
    increment_amount: number | null;
    increment_type: CampaignWarmupIncrementType | null;
    interval_unit: CampaignWarmupIntervalUnit | "week" | null;
    interval_value: number | null;
    max_limit: number | null;
  };
  financial: {
    currency: string | null;
    price_per_sms_segment: number | null;
    estimated_cost: number | null;
    estimated_sms_segments: number;
  };
  errors: Record<string, CampaignEstimateSectionMessage[]>;
  warnings: Record<string, CampaignEstimateSectionMessage[]>;
};

export type CampaignApiResponse<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
};

export type CampaignDispatchStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "sending"
  | "completed"
  | "completed_with_errors"
  | "cancelled"
  | "failed";

export type CampaignProviderBroadcast = {
  id: number;
  campaign_dispatch_id: number;
  provider: string;
  external_broadcast_id: string;
  idempotency_key: string | null;
  status: string | null;
  messages_count: number;
  metrics: { sent?: number; failed?: number; total?: number } | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignDispatch = {
  id: number;
  uuid: string;
  campaign_id: number;
  occurrence_key: string;
  status: CampaignDispatchStatus;
  scheduled_for: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  skipped_count: number;
  prepared_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  provider_broadcasts?: CampaignProviderBroadcast[];
};

export type CampaignDispatchesResponse = {
  campaign_id: number;
  status: CampaignStatus;
  dispatches: CampaignDispatch[];
};

export type CampaignLaunchResponse = {
  campaign: CampaignDetail;
  dispatch: CampaignDispatch;
  validation: CampaignValidationResponse;
};

export const CAMPAIGN_DISPATCH_STATUS_LABELS: Record<CampaignDispatchStatus, string> = {
  pending: "Pendente",
  preparing: "Preparando público",
  ready: "Pronto para envio",
  sending: "Enviando",
  completed: "Concluído",
  completed_with_errors: "Concluído com erros",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export type CampaignFormState = {
  name: string;
  description: string | null;
  type: CampaignType;
  channel: CampaignChannel;
  metadata: CampaignMetadata | null;
  single_stage_config: CampaignSingleStageConfigPayload;
  message: CampaignMessagePayload;
  links: CampaignLinkPayload[];
  schedule: CampaignSchedulePayload;
  delivery_windows: CampaignDeliveryWindowPayload[];
  recurrence_policy: CampaignRecurrencePolicyPayload;
  warmup_policy: CampaignWarmupPolicyPayload;
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  validating: "Validando",
  validation_failed: "Validação falhou",
  validated: "Validada",
  prepared: "Preparada",
  running: "Em execução",
  paused: "Pausada",
  completed: "Concluída",
  canceled: "Cancelada",
  archived: "Arquivada",
};

export const CAMPAIGN_STATUS_OPTIONS = Object.entries(CAMPAIGN_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as CampaignStatus,
    label,
  }),
);

export const CAMPAIGN_CHANNEL_OPTIONS = [
  { label: "SMS", value: "sms" as CampaignChannel },
];

export const CAMPAIGN_TYPE_OPTIONS = [
  { label: "Broadcast", value: "broadcast" as CampaignType },
];

export const CAMPAIGN_PROGRESS_STATUS_LABELS = {
  missing: "Pendente",
  partial: "Parcial",
  valid: "Válido",
} as const;

export const CAMPAIGN_CHECKLIST_STATUS_LABELS = {
  valid: "Válido",
  warning: "Alerta",
  invalid: "Inválido",
} as const;

export const CAMPAIGN_DAY_OPTIONS = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
];
