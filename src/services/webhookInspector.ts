import api from "./base";

/** Perfis da equipe Elevate com acesso ao Webhook Inspector (igual à rota da API). */
export const WEBHOOK_INSPECTOR_ROLES = [
  "member-proprietor",
  "member-admin",
  "member-developer",
];

export interface WebhookInspectorEndpoint {
  uuid: string;
  project_id: number | null;
  name: string;
  description: string | null;
  url: string;
  is_active: boolean;
  response_status: number;
  response_content_type: string;
  response_body: string | null;
  cors_enabled: boolean;
  requests_count: number;
  last_request_at: string | null;
  created_by: { id: number; name: string } | null;
  created_at: string | null;
  updated_at: string | null;
}

export type WebhookInspectorEndpointPayload = Partial<
  Pick<
    WebhookInspectorEndpoint,
    | "name"
    | "description"
    | "is_active"
    | "response_status"
    | "response_content_type"
    | "response_body"
    | "cors_enabled"
  >
>;

export interface WebhookInspectorRequestSummary {
  id: number;
  uuid: string;
  method: string;
  path: string | null;
  query_string: string | null;
  size: number;
  content_type: string | null;
  ip: string | null;
  created_at: string;
}

export interface WebhookInspectorRequestDetail extends WebhookInspectorRequestSummary {
  url: string;
  headers: Record<string, string>;
  body: string | null;
  body_base64: boolean;
  body_truncated: boolean;
  form: Record<string, unknown> | null;
  files: { field: string; name: string; size: number; mime: string | null }[] | null;
  user_agent: string | null;
}

export interface WebhookInspectorRequestPage {
  items: WebhookInspectorRequestSummary[];
  has_more: boolean;
  total: number;
}

export interface WebhookInspectorRequestFilters {
  after_id?: number;
  before_id?: number;
  method?: string;
  search?: string;
  limit?: number;
}

const base = "/webhook-inspector/endpoints";

// Todo endpoint pertence a um projeto; a API recusa chamadas sem o projeto ativo.
async function listEndpoints(projectId: number): Promise<WebhookInspectorEndpoint[]> {
  const { data } = await api.get(base, { params: { project_id: projectId } });
  return data.data;
}

async function getEndpoint(projectId: number, uuid: string): Promise<WebhookInspectorEndpoint> {
  const { data } = await api.get(`${base}/${uuid}`, { params: { project_id: projectId } });
  return data.data;
}

async function createEndpoint(
  projectId: number,
  payload: WebhookInspectorEndpointPayload,
): Promise<WebhookInspectorEndpoint> {
  const { data } = await api.post(base, { ...payload, project_id: projectId });
  return data.data;
}

async function updateEndpoint(
  projectId: number,
  uuid: string,
  payload: WebhookInspectorEndpointPayload,
): Promise<WebhookInspectorEndpoint> {
  const { data } = await api.put(`${base}/${uuid}`, { ...payload, project_id: projectId });
  return data.data;
}

async function deleteEndpoint(projectId: number, uuid: string): Promise<void> {
  await api.delete(`${base}/${uuid}`, { params: { project_id: projectId } });
}

async function listRequests(
  projectId: number,
  uuid: string,
  filters: WebhookInspectorRequestFilters = {},
): Promise<WebhookInspectorRequestPage> {
  const { data } = await api.get(`${base}/${uuid}/requests`, {
    params: { ...filters, project_id: projectId },
  });
  return data.data;
}

async function getRequest(
  projectId: number,
  uuid: string,
  requestUuid: string,
): Promise<WebhookInspectorRequestDetail> {
  const { data } = await api.get(`${base}/${uuid}/requests/${requestUuid}`, {
    params: { project_id: projectId },
  });
  return data.data;
}

async function deleteRequest(projectId: number, uuid: string, requestUuid: string): Promise<void> {
  await api.delete(`${base}/${uuid}/requests/${requestUuid}`, { params: { project_id: projectId } });
}

async function clearRequests(projectId: number, uuid: string): Promise<number> {
  const { data } = await api.delete(`${base}/${uuid}/requests`, { params: { project_id: projectId } });
  return data.data?.deleted ?? 0;
}

export default {
  listEndpoints,
  getEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  listRequests,
  getRequest,
  deleteRequest,
  clearRequests,
};
