export type EventType =
  | "campaign.entered"
  | "campaign.exited"
  | "sms.queued"
  | "sms.sent"
  | "sms.delivered"
  | "sms.failed"
  | "link.clicked"
  | "conversion.created"
  | "contact.opted_out";

export interface CanonicalEvent {
  id: number;
  event_id: string;
  event_type: EventType;
  schema_version: string;
  occurred_at: string;
  recorded_at: string;
  workspace_id: string;
  project_id: number;
  subject_type: string;
  subject_id: string;
  data: Record<string, unknown>;
  references_data: {
    campaign_id?: string | number | null;
    campaign_dispatch_id?: number | null;
    recipient_id?: number | null;
    [key: string]: unknown;
  };
  correlation_id: string | null;
  causation_id: string | null;
  dedup_key?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineQueryParams {
  since?: string;
  until?: string;
  limit?: number;
}

export interface ContactTimelineQueryParams {
  project_id: number;
  since?: string;
  limit?: number;
}

export interface TimelineResponse {
  data: CanonicalEvent[];
}

export interface RunCounts {
  total_recipients: number;
  sent: number;
  failed: number;
  pending: number;
  processing: number;
  canceled: number;
}

export interface CampaignRun {
  id: number;
  status: string;
  prepared_at: string | null;
  started_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  canceled_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  counts: RunCounts;
  progress: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface CampaignBatch {
  id: number;
  sequence: number;
  status: string;
  attempts: number;
  next_retry_at: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  progress: Record<string, unknown>;
}

export interface CampaignWave {
  id: number;
  sequence: number;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  progress: Record<string, unknown>;
  batches: CampaignBatch[];
}

export interface EventMetrics {
  since: string | null;
  "campaign.entered": number;
  "campaign.exited": number;
  "sms.queued": number;
  "sms.sent": number;
  "sms.delivered": number;
  "sms.failed": number;
  "link.clicked": number;
  delivery_rate: number;
  click_rate: number;
}

export interface CampaignForecast {
  total_recipients: number;
  sent: number;
  failed: number;
  pending: number;
  completed_percent: number;
  rate_per_minute: number;
  eta_seconds: number | null;
  estimate_complete_at: string | null;
}

export interface CampaignMonitor {
  campaign_id: number;
  campaign_status: string;
  run: CampaignRun | null;
  waves: CampaignWave[];
  events: EventMetrics;
  forecast: CampaignForecast;
}

export interface ForecastResponse {
  forecast: CampaignForecast;
}

export interface ClickMinutePoint {
  minute: string;
  clicks: number;
}

export interface CanonicalCampaignClicks {
  campaign_id: string;
  link_id: number;
  clicks: number;
}

export interface CanonicalClicks {
  total: number;
  by_campaign: CanonicalCampaignClicks[];
  since: string;
}

export interface UnhealthyLinkItem {
  link_id: number;
  link_destination_id: number;
  url: string;
  status: string;
  http_status: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string | null;
}

export interface RedirectLatency {
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  sample_size: number;
}

export interface RedirectErrors {
  "4xx": number;
  "5xx": number;
}

export interface LinkEngineMonitorResponse {
  clicks_last_5min: number;
  clicks_per_minute_24h: ClickMinutePoint[];
  canonical_clicks: CanonicalClicks;
  queue_pending: number;
  avg_processing_delay_ms: number | null;
  redirect_latency: RedirectLatency;
  redirect_errors: RedirectErrors;
  unhealthy_links: UnhealthyLinkItem[];
}

export interface OutboxItem {
  id: number;
  event_id: string;
  event_type: string;
  project_id: number;
  project_webhook_id: number | null;
  payload: Record<string, unknown>;
  available_at: string;
  processed_at: string | null;
  attempts: number;
  last_error: string | null;
  dlq: boolean;
}

export interface OutboxReplayResponse {
  message: string;
  requeued: number;
}

export interface WebhookDeliveryLog {
  id: number;
  project_id: number;
  event_type: string | null;
  success: boolean;
  response_status: number | null;
  reason: string | null;
  payload?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IncomingWebhookLog {
  id: number;
  project_id: number;
  type: string;
  payload: Record<string, unknown> | null;
  status: string;
  error: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  project: { id: number; name: string } | null;
}

export interface IncomingWebhooksSummary {
  total: number;
  pending: number;
  errors: number;
}

export interface IncomingWebhooksResponse {
  summary: IncomingWebhooksSummary;
  logs: PaginatedResponse<IncomingWebhookLog>;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string | null;
  from?: number | null;
  last_page: number;
  last_page_url?: string | null;
  links?: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url?: string | null;
  path?: string | null;
  per_page: number;
  prev_page_url?: string | null;
  to?: number | null;
  total: number;
}

export interface IncrementalEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  subject_type: string;
  subject_id: string;
  data: Record<string, unknown>;
  references: Record<string, unknown>;
}

export interface IncrementalResponse {
  data: IncrementalEvent[];
  next_cursor: string | null;
  count: number;
}

export interface IncrementalQueryParams {
  project_id: number;
  since?: string;
  event_types?: EventType[];
}

export const EVENT_TYPES: EventType[] = [
  "campaign.entered",
  "campaign.exited",
  "sms.queued",
  "sms.sent",
  "sms.delivered",
  "sms.failed",
  "link.clicked",
  "conversion.created",
  "contact.opted_out",
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  "campaign.entered": "Campanha iniciada",
  "campaign.exited": "Campanha finalizada",
  "sms.queued": "SMS enfileirado",
  "sms.sent": "SMS enviado",
  "sms.delivered": "SMS entregue",
  "sms.failed": "Falha no SMS",
  "link.clicked": "Link clicado",
  "conversion.created": "Conversão criada",
  "contact.opted_out": "Contato optou por sair",
};

export const EVENT_TYPE_VARIANTS: Record<EventType, string> = {
  "campaign.entered": "default",
  "campaign.exited": "secondary",
  "sms.queued": "outline",
  "sms.sent": "default",
  "sms.delivered": "default",
  "sms.failed": "destructive",
  "link.clicked": "default",
  "conversion.created": "secondary",
  "contact.opted_out": "secondary",
};

export const MONITOR_EVENT_TYPES: Array<{
  key: keyof EventMetrics;
  label: string;
}> = [
  { key: "campaign.entered", label: "Entradas" },
  { key: "campaign.exited", label: "Saídas" },
  { key: "sms.queued", label: "Enfileirados" },
  { key: "sms.sent", label: "Enviados" },
  { key: "sms.delivered", label: "Entregues" },
  { key: "sms.failed", label: "Falhas" },
  { key: "link.clicked", label: "Cliques" },
];

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as string[]).includes(value);
}
