import api from "./base";
import type {
  CampaignMonitor,
  CanonicalClicks,
  ContactTimelineQueryParams,
  ForecastResponse,
  IncrementalQueryParams,
  IncrementalResponse,
  IncomingWebhooksResponse,
  LinkEngineMonitorResponse,
  OutboxItem,
  OutboxReplayResponse,
  PaginatedResponse,
  TimelineQueryParams,
  TimelineResponse,
  WebhookDeliveryLog,
} from "@/contracts/observability";

export async function getContactTimeline(
  contact: string,
  params: ContactTimelineQueryParams,
): Promise<TimelineResponse> {
  const { data } = await api.get<TimelineResponse>(`/timeline/contacts/${encodeURIComponent(contact)}`, {
    params,
  });
  return data;
}

export async function getCampaignTimeline(
  campaignId: number,
  projectId: number,
  params: TimelineQueryParams = {},
): Promise<TimelineResponse> {
  const { data } = await api.get<TimelineResponse>(`/campaigns/${campaignId}/timeline`, {
    params: { project_id: projectId, ...params },
  });
  return data;
}

export async function getRecipientTimeline(
  recipientId: number,
  projectId: number,
  params: TimelineQueryParams = {},
): Promise<TimelineResponse> {
  const { data } = await api.get<TimelineResponse>(`/recipients/${recipientId}/timeline`, {
    params: { project_id: projectId, ...params },
  });
  return data;
}

export async function getCampaignMonitor(
  campaignId: number,
  projectId: number,
): Promise<CampaignMonitor> {
  const { data } = await api.get<CampaignMonitor>(`/campaigns/${campaignId}/monitor`, {
    params: { project_id: projectId },
  });
  return data;
}

export async function getCampaignForecast(
  campaignId: number,
  projectId: number,
): Promise<ForecastResponse> {
  const { data } = await api.get<ForecastResponse>(`/campaigns/${campaignId}/monitor/forecast`, {
    params: { project_id: projectId },
  });
  return data;
}

export async function getLinkEngineMonitor(
  projectId: number,
  params: Record<string, string | number> = {},
): Promise<LinkEngineMonitorResponse> {
  const { data } = await api.get<LinkEngineMonitorResponse>("/link-engine/monitor", {
    params: { project_id: projectId, ...params },
  });
  return data;
}

export async function getLinkEngineClicks(
  projectId: number,
  params: Record<string, string | number> = {},
): Promise<CanonicalClicks> {
  const { data } = await api.get<CanonicalClicks>("/link-engine/monitor/clicks", {
    params: { project_id: projectId, ...params },
  });
  return data;
}

export async function getWebhookOutbox(
  projectId: number,
  params: Record<string, string | number | boolean> = {},
): Promise<PaginatedResponse<OutboxItem>> {
  const { data } = await api.get<PaginatedResponse<OutboxItem>>("/webhooks/admin/outbox", {
    params: { project_id: projectId, ...params },
  });
  return data;
}

export async function replayWebhookOutbox(ids: number[]): Promise<OutboxReplayResponse> {
  const { data } = await api.post<OutboxReplayResponse>("/webhooks/admin/outbox/replay", { ids });
  return data;
}

export async function getWebhookDeliveryLogs(
  projectId: number,
  params: Record<string, string | number | boolean> = {},
): Promise<PaginatedResponse<WebhookDeliveryLog>> {
  const { data } = await api.get<PaginatedResponse<WebhookDeliveryLog>>("/webhooks/admin/logs", {
    params: { project_id: projectId, ...params },
  });
  return data;
}

export async function getIncomingWebhooks(
  projectId: number,
  params: Record<string, string | number | boolean> = {},
): Promise<IncomingWebhooksResponse> {
  const { data } = await api.get<IncomingWebhooksResponse>("/webhooks/admin/incoming", {
    params: { project_id: projectId, ...params },
  });
  return data;
}

export async function getIncrementalEvents(params: IncrementalQueryParams): Promise<IncrementalResponse> {
  const { data } = await api.get<IncrementalResponse>("/dashboard/events/incremental", { params });
  return data;
}

export default {
  getContactTimeline,
  getCampaignTimeline,
  getRecipientTimeline,
  getCampaignMonitor,
  getCampaignForecast,
  getLinkEngineMonitor,
  getLinkEngineClicks,
  getWebhookOutbox,
  replayWebhookOutbox,
  getWebhookDeliveryLogs,
  getIncomingWebhooks,
  getIncrementalEvents,
};
