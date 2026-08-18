import api from "./base.js";
import type {
  ElevateSmsCallbackTokenRotation,
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

/**
 * POST /v1/projects/{project_id}/integrations/elevate-sms/callback-token/rotate
 * Gera um novo token de callback e invalida o anterior imediatamente.
 * A resposta traz o token e a URL em claro — exibição única.
 */
export async function rotateElevateSmsCallbackToken(
  projectId: number | string,
): Promise<ElevateSmsCallbackTokenRotation> {
  const { data } = await api.post<Envelope<ElevateSmsCallbackTokenRotation>>(
    `/projects/${projectId}/integrations/elevate-sms/callback-token/rotate`,
  );
  return data.data;
}

const elevateSmsIntegrationService = {
  getElevateSmsConfig,
  saveElevateSmsConfig,
  rotateElevateSmsCallbackToken,
};

export default elevateSmsIntegrationService;
