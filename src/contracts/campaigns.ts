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

export type CampaignValidationItem = {
  field: string;
  message: string;
};

export type CampaignValidationSection =
  | "campaign"
  | "message"
  | "links"
  | "schedule"
  | "delivery_windows"
  | "recurrence_policy"
  | "warmup_policy";

export type CampaignValidationSections = Partial<
  Record<CampaignValidationSection, CampaignValidationItem[]>
>;

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

export type CampaignSingleStageConfig = CampaignSingleStageConfigPayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type CampaignMessage = CampaignMessagePayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type CampaignLink = CampaignLinkPayload & {
  id?: number | null;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type CampaignSchedule = CampaignSchedulePayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type CampaignDeliveryWindow = CampaignDeliveryWindowPayload & {
  id?: number | null;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type CampaignRecurrencePolicy = CampaignRecurrencePolicyPayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type CampaignWarmupPolicy = CampaignWarmupPolicyPayload & {
  id?: number;
  campaign_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type CampaignDetail = {
  id: number;
  uuid: string;
  project_id: number;
  created_by: number;
  updated_by: number | null;
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
  project?: unknown;
  user_project_group?: unknown | null;
  single_stage_config?: CampaignSingleStageConfig | null;
  messages?: CampaignMessage[];
  links?: CampaignLink[];
  schedule?: CampaignSchedule | null;
  delivery_windows?: CampaignDeliveryWindow[];
  recurrence_policy?: CampaignRecurrencePolicy | null;
  warmup_policy?: CampaignWarmupPolicy | null;
};

export type CampaignValidationResponse = {
  success: boolean;
  message: string | null;
  data: {
    valid: boolean;
    status: "valid" | "invalid";
    errors: CampaignValidationSections;
    warnings: CampaignValidationSections;
  };
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

export const CAMPAIGN_DAY_OPTIONS = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
];
