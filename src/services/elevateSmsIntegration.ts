import api from "./base.js";
import type {
  ElevateSmsIntegrationConfig,
  ElevateSmsIntegrationPayload,
} from "@/contracts/elevateSmsIntegration";

type Envelope<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

/**
 * GET /v1/projects/{project_id}/integrations/elevate-sms
 * 404 → integração ainda não configurada (ou sem permissão).
 */
export async function getElevateSmsConfig(
  projectId: number | string,
): Promise<ElevateSmsIntegrationConfig> {
  const { data } = await api.get<Envelope<ElevateSmsIntegrationConfig>>(
    `/projects/${projectId}/integrations/elevate-sms`,
  );
  return data.data;
}

/**
 * PUT /v1/projects/{project_id}/integrations/elevate-sms
 * Upsert: cria ou atualiza. Retorna a config persistida (api_key mascarada).
 */
export async function saveElevateSmsConfig(
  projectId: number | string,
  payload: ElevateSmsIntegrationPayload,
): Promise<ElevateSmsIntegrationConfig> {
  const { data } = await api.put<Envelope<ElevateSmsIntegrationConfig>>(
    `/projects/${projectId}/integrations/elevate-sms`,
    payload,
  );
  return data.data;
}

const elevateSmsIntegrationService = {
  getElevateSmsConfig,
  saveElevateSmsConfig,
};

export default elevateSmsIntegrationService;
