export type CampaignRunStatus =
  | "prepared"
  | "running"
  | "paused"
  | "completed"
  | "canceled"
  | "failed";

export type CampaignRunRecipientStatus =
  | "pending"
  | "queued"
  | "processing"
  | "sent"
  | "failed"
  | "canceled"
  | "dead_letter";

export type CampaignWaveStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "canceled"
  | "failed";

export type CampaignBatchStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "canceled"
  | "failed";

export type CampaignRunProgress = {
  percent?: number | null;
  eta?: string | null;
  processed?: number | null;
  remaining?: number | null;
};

export type CampaignRunMetadata = {
  progress?: CampaignRunProgress | null;
  [key: string]: unknown;
};

export type CampaignRunCounts = {
  total_recipients: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  canceled: number;
  dead_letter?: number;
};

export type CampaignRun = {
  id: number;
  campaign_id: number;
  status: CampaignRunStatus;
  total_recipients: number;
  counts: CampaignRunCounts;
  prepared_at: string | null;
  started_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  canceled_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  metadata: CampaignRunMetadata | null;
  created_at: string;
  updated_at: string;
};

export type CampaignBatch = {
  id: number;
  dispatch_wave_id: number;
  sequence: number;
  status: CampaignBatchStatus;
  attempts: number;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  next_retry_at: string | null;
  last_error: string | null;
  metadata: CampaignRunMetadata | null;
  progress?: CampaignRunProgress | null;
};

export type CampaignWave = {
  id: number;
  campaign_run_id: number;
  sequence: number;
  status: CampaignWaveStatus;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  metadata: CampaignRunMetadata | null;
  batches: CampaignBatch[];
};

export type CampaignRunWithWaves = {
  run: CampaignRun;
  waves: CampaignWave[];
};

export type CampaignRunActionResponse = {
  campaign_id: number;
  campaign_run_id: number;
  status: CampaignRunStatus;
  total_recipients: number;
};

export type CampaignPrepareResponse = CampaignRunActionResponse & {
  waves: number;
  batches: number;
};

export type CampaignRunRecipientsFilters = {
  status?: CampaignRunRecipientStatus | null;
  dispatch_wave_id?: number | null;
  broadcast_batch_id?: number | null;
  player_id?: string | null;
  phone?: string | null;
  per_page?: number | null;
  page?: number | null;
};

export type CampaignRunRecipient = {
  id: number;
  campaign_run_id: number;
  dispatch_wave_id: number | null;
  broadcast_batch_id: number | null;
  player_id: string | null;
  phone: string | null;
  status: CampaignRunRecipientStatus;
  attempts: number;
  next_retry_at: string | null;
  last_error: string | null;
  /** supplier_message_id do envio real (Fase 4). */
  provider_message_id?: string | null;
  payload_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  queued_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignRunRecipientsResponse = {
  current_page: number;
  data: CampaignRunRecipient[];
  per_page: number;
  total: number;
  last_page: number;
};

export const CAMPAIGN_RUN_STATUS_LABELS: Record<CampaignRunStatus, string> = {
  prepared: "Preparada",
  running: "Em execução",
  paused: "Pausada",
  completed: "Concluída",
  canceled: "Cancelada",
  failed: "Falhou",
};

export const CAMPAIGN_RUN_RECIPIENT_STATUS_LABELS: Record<CampaignRunRecipientStatus, string> = {
  pending: "Pendente",
  queued: "Na fila",
  processing: "Processando",
  sent: "Enviado",
  failed: "Falhou",
  canceled: "Cancelado",
  dead_letter: "Dead letter",
};

export const CAMPAIGN_RUN_RECIPIENT_STATUS_OPTIONS = Object.entries(
  CAMPAIGN_RUN_RECIPIENT_STATUS_LABELS,
).map(([value, label]) => ({
  value: value as CampaignRunRecipientStatus,
  label,
}));

export const CAMPAIGN_RUN_RECIPIENT_PER_PAGE_OPTIONS = [50, 100, 200];
