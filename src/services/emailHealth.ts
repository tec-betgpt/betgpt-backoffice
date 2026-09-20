import api from './base';
import type {
  ApiEnvelope,
  AuthSeriesPoint,
  ComplianceSnapshot,
  DeliveryErrorDay,
  EmailHealthDomain,
  EmailHealthOverview,
  EmailHealthQuery,
  FeedbackLoopItem,
  ManualSyncResponse,
  SpamRatePoint,
  SpamRateReference,
  SyncRun,
  TlsSeriesPoint,
} from '@/contracts/emailHealth';

export interface EmailHealthSeriesResponse<T> {
  series: T[];
  period: { from: string; to: string };
}

export interface EmailHealthComplianceResponse {
  available: boolean;
  latest: ComplianceSnapshot[];
  history: { metric_date: string; requirements: ComplianceSnapshot[] }[];
  period: { from: string; to: string };
}

export interface EmailHealthFeedbackLoopResponse {
  available: boolean;
  items: FeedbackLoopItem[];
  period: { from: string; to: string };
}

export interface EmailHealthSpamRateResponse extends EmailHealthSeriesResponse<SpamRatePoint> {
  references: SpamRateReference[];
}

export async function listDomains(filterId: string) {
  const { data } = await api.get<ApiEnvelope<{ domains: EmailHealthDomain[] }>>(
    '/email-health/domains',
    { params: { filter_id: filterId } },
  );
  return data.data.domains;
}

export async function getOverview(domainId: number, query: EmailHealthQuery) {
  const { data } = await api.get<ApiEnvelope<EmailHealthOverview>>(
    `/email-health/domains/${domainId}/overview`,
    { params: query },
  );
  return data.data;
}

export async function getSpamRate(domainId: number, query: EmailHealthQuery) {
  const { data } = await api.get<ApiEnvelope<EmailHealthSpamRateResponse>>(
    `/email-health/domains/${domainId}/spam-rate`,
    { params: query },
  );
  return data.data;
}

export async function getCompliance(domainId: number, query: EmailHealthQuery) {
  const { data } = await api.get<ApiEnvelope<EmailHealthComplianceResponse>>(
    `/email-health/domains/${domainId}/compliance`,
    { params: query },
  );
  return data.data;
}

export async function getFeedbackLoop(domainId: number, query: EmailHealthQuery) {
  const { data } = await api.get<ApiEnvelope<EmailHealthFeedbackLoopResponse>>(
    `/email-health/domains/${domainId}/feedback-loop`,
    { params: query },
  );
  return data.data;
}

export async function getAuthentication(domainId: number, query: EmailHealthQuery) {
  const { data } = await api.get<ApiEnvelope<EmailHealthSeriesResponse<AuthSeriesPoint>>>(
    `/email-health/domains/${domainId}/authentication`,
    { params: query },
  );
  return data.data;
}

export async function getEncryption(domainId: number, query: EmailHealthQuery) {
  const { data } = await api.get<ApiEnvelope<EmailHealthSeriesResponse<TlsSeriesPoint>>>(
    `/email-health/domains/${domainId}/encryption`,
    { params: query },
  );
  return data.data;
}

export async function getDeliveryErrors(domainId: number, query: EmailHealthQuery) {
  const { data } = await api.get<ApiEnvelope<EmailHealthSeriesResponse<DeliveryErrorDay>>>(
    `/email-health/domains/${domainId}/delivery-errors`,
    { params: query },
  );
  return data.data;
}

/** Ações administrativas (role member — backend responde 401/403 se negado). */
export async function triggerManualSync(payload: { domain?: string; from?: string; to?: string }) {
  const { data } = await api.post<ApiEnvelope<ManualSyncResponse>>('/email-health/sync', payload);
  return data.data; // 202 — sync_run_id para rastreio
}

export async function listSyncRuns() {
  const { data } = await api.get<ApiEnvelope<{ sync_runs: SyncRun[] }>>('/email-health/sync-runs');
  return data.data.sync_runs;
}

export async function updateDomain(
  domainId: number,
  payload: { project_id?: number | null; active?: boolean },
) {
  const { data } = await api.patch<ApiEnvelope<EmailHealthDomain>>(
    `/email-health/domains/${domainId}`,
    payload,
  );
  return data.data;
}

/**
 * OAuth por projeto (padrão das demais integrações — slug
 * google-postmaster na tela de fontes de dados do projeto).
 */
export async function getPostmasterAuthUrl(projectId: number, integrationId: number) {
  const { data } = await api.get<ApiEnvelope<{ url: string }>>(
    '/projects/integrations/oauth/postmaster',
    { params: { project_id: projectId, integration_id: integrationId } },
  );
  return data.data.url; // abrir em popup — o callback fecha a janela
}
