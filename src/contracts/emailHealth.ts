export type PostmasterSourceVersion = 'v1' | 'v2';
export type IpReputationCategory = 'HIGH' | 'MEDIUM' | 'LOW' | 'BAD';
export type ComplianceStatus = 'COMPLIANT' | 'NEEDS_WORK';
export type EmailHealthRange = '7d' | '30d' | '60d' | '90d' | '120d';

/** Envelope padrão da API. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
}

/** Ponto de métrica — value null + available false = NÃO exibir zero. */
export interface MetricPoint<T = number> {
  value: T | null;
  source_version: PostmasterSourceVersion;
  metric_date: string | null;
  available: boolean;
}

export interface EmailHealthDomain {
  id: number;
  domain: string;
  project_id: number | null;
  active: boolean;
  available_v2: boolean;
  google_permission: string | null;
  verification_state: string | null;
  google_create_time: string | null;
  google_last_verify_time: string | null;
  last_successful_sync_at: string | null;
}

/** Saúde das fontes — dirige os indicadores "Postmaster V1 ● / V2 ●". */
export interface SourceHealth {
  status: 'ok' | 'failed' | 'no_data';
  last_success_at: string | null;
  last_data_date: string | null; // v1 descontinuada: exibir "histórico até {last_data_date}"
}

export interface IpReputationCategoryData {
  ip_count: number;
  share: number;               // fração 0..1 do conjunto de IPs do dia
  sample_ips: string[] | null; // APENAS tooltip — nunca no corpo do gráfico
}

export interface IpReputationDay {
  metric_date: string;
  source_version: PostmasterSourceVersion;
  available: boolean;
  categories: Partial<Record<IpReputationCategory, IpReputationCategoryData>>;
}

export interface SpamRatePoint extends MetricPoint<number> {
  lower_bound?: number; // apenas v1, quando fornecido
  upper_bound?: number;
}

export interface SpamRateReference {
  value: number;    // fração (0.001 = 0,10%)
  percent: string;  // "0.10%" — exibir como está
  label: 'Recomendado' | 'Política';
}

export interface ComplianceSnapshot {
  requirement: string;   // SPF, DKIM, DMARC_POLICY, ONE_CLICK_UNSUBSCRIBE, ...
  status: ComplianceStatus;
  needs_work: boolean;   // destaque visual OBRIGATÓRIO (não só cor)
  reason: string | null;
  metric_date: string;
  source_version: 'v2';
}

export interface FeedbackLoopItem {
  metric_date: string;
  feedback_loop_id: string;
  aggregation_key_type: 'FROM_HEADER' | 'ALL_DKIM' | string;
  spam_ratio: number | null;
  source_version: PostmasterSourceVersion;
}

export interface AuthSeriesPoint {
  metric_date: string;
  source_version: PostmasterSourceVersion;
  spf: number | null;
  dkim: number | null;
  dmarc: number | null;
  available: boolean;
}

export interface TlsSeriesPoint {
  metric_date: string;
  source_version: PostmasterSourceVersion;
  inbound: number | null;
  outbound: number | null;
  inbound_count: number | null;
  outbound_count: number | null;
  available: boolean;
}

export interface DeliveryErrorEntry {
  source_version: PostmasterSourceVersion;
  error_class: 'PERMANENT_ERROR' | 'TEMPORARY_ERROR' | null; // v1
  error_type: string | null;                                 // v1
  error_reason: string | null;                               // v2 (reject/temp_fail + motivo)
  error_count: number | null;                                // v2
  error_ratio: number | null;
}

export interface DeliveryErrorDay {
  metric_date: string;
  available: boolean;
  errors: DeliveryErrorEntry[];
}

export interface EmailHealthOverview {
  domain: EmailHealthDomain;
  period: { from: string; to: string };
  sources: { v2: SourceHealth };
  spam_rate: MetricPoint<number>;
  last_successful_sync_at: string | null;
}

export interface ManualSyncResponse {
  sync_run_id: number;
  domains: string[];
  period: { from: string; to: string };
  queue: string;
}

export interface SyncRun {
  id: number;
  type: 'backfill_v1' | 'daily' | 'manual';
  status: 'running' | 'success' | 'partial' | 'failed';
  api_v1_status: 'ok' | 'partial' | 'failed' | 'skipped' | null;
  api_v2_status: 'ok' | 'partial' | 'failed' | 'skipped' | null;
  domains_attempted: number;
  domains_success: number;
  domains_failed: number;
  error_summary: string | null;
  started_at: string | null;
  finished_at: string | null;
  items: SyncRunItem[];
}

export interface SyncRunItem {
  id: number;
  api_version: PostmasterSourceVersion;
  endpoint: 'domains' | 'trafficStats' | 'domainStats' | 'complianceStatus';
  domain: string | null;
  status: 'running' | 'success' | 'failed';
  http_status: number | null;
  records_received: number;
  records_inserted: number;
  records_updated: number;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface EmailHealthQuery {
  filter_id: string;
  range?: EmailHealthRange;
  from?: string; // Y-m-d
  to?: string;   // Y-m-d
  source_version?: PostmasterSourceVersion;
}
