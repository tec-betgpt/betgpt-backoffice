import axios from "axios";
import api from "./base";
import type {
  CreateMarketingApiKeyPayload,
  MarketingApiKey,
  MarketingApiKeyError,
  MarketingApiKeyErrorCode,
  MarketingApiKeyIssued,
  MarketingApiKeyRotated,
  SpaApiResponse,
  UpdateMarketingApiKeyPayload,
} from "@/contracts/marketingApiKeys";
import { MARKETING_API_KEY_ERROR_CODES } from "@/contracts/marketingApiKeys";

/**
 * Extrai o id numérico do grupo a partir da chave de workspace da preferência
 * `selected_group_project` (formato `group_{id}`). Retorna null quando a
 * seleção não é um grupo (ex.: `project_{id}` ou `all`).
 *
 * O id é usado apenas para montar as rotas administrativas — nunca é enviado
 * no body (o backend rejeita com 422 `immutable_fields`).
 */
export function resolveGroupIdFromWorkspaceKey(
  workspaceKey: string | null | undefined,
): number | null {
  if (!workspaceKey) return null;
  const match = /^group_(\d+)$/.exec(workspaceKey);
  return match ? Number(match[1]) : null;
}

function basePath(groupId: number): string {
  return `/user-project-groups/${groupId}/api-keys`;
}

function unwrap<T>(payload: SpaApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as SpaApiResponse<T>).data;
  }
  return payload as T;
}

/** Normaliza erros da administração de API keys para consumo da store/UI. */
export function normalizeMarketingApiKeyError(
  error: unknown,
): MarketingApiKeyError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const body = error.response?.data as
      | { message?: string; data?: { code?: string } }
      | undefined;
    const rawCode = body?.data?.code;
    const code = MARKETING_API_KEY_ERROR_CODES.includes(
      rawCode as MarketingApiKeyErrorCode,
    )
      ? (rawCode as MarketingApiKeyErrorCode)
      : null;

    return {
      status,
      code,
      message: body?.message ?? error.message,
    };
  }

  return {
    status: null,
    code: null,
    message: error instanceof Error ? error.message : String(error),
  };
}

/** Atalho para ramificar em um código estável (ex.: `state_conflict`). */
export function isMarketingApiKeyError(
  error: unknown,
  code: MarketingApiKeyErrorCode,
): boolean {
  return normalizeMarketingApiKeyError(error).code === code;
}

/** GET /v1/user-project-groups/{groupId}/api-keys — array sem paginação. */
export async function listApiKeys(
  groupId: number,
): Promise<MarketingApiKey[]> {
  const { data } = await api.get<SpaApiResponse<MarketingApiKey[]>>(
    basePath(groupId),
  );
  return unwrap(data);
}

/** POST /v1/user-project-groups/{groupId}/api-keys — `201` com secret único. */
export async function createApiKey(
  groupId: number,
  payload: CreateMarketingApiKeyPayload,
): Promise<MarketingApiKeyIssued> {
  const { data } = await api.post<SpaApiResponse<MarketingApiKeyIssued>>(
    basePath(groupId),
    payload,
  );
  return unwrap(data);
}

/** PATCH /v1/user-project-groups/{groupId}/api-keys/{uuid} */
export async function updateApiKey(
  groupId: number,
  uuid: string,
  payload: UpdateMarketingApiKeyPayload,
): Promise<MarketingApiKey> {
  const { data } = await api.patch<
    SpaApiResponse<{ api_key: MarketingApiKey } | MarketingApiKey>
  >(`${basePath(groupId)}/${uuid}`, payload);
  const unwrapped = unwrap(data);
  return "api_key" in unwrapped ? unwrapped.api_key : unwrapped;
}

/** POST /v1/user-project-groups/{groupId}/api-keys/{uuid}/rotate */
export async function rotateApiKey(
  groupId: number,
  uuid: string,
): Promise<MarketingApiKeyRotated> {
  const { data } = await api.post<SpaApiResponse<MarketingApiKeyRotated>>(
    `${basePath(groupId)}/${uuid}/rotate`,
  );
  return unwrap(data);
}

/**
 * DELETE /v1/user-project-groups/{groupId}/api-keys/{uuid}
 *
 * O registro permanece na listagem com status `revoked` (trilha de auditoria);
 * retorna a chave atualizada quando o backend a inclui na resposta.
 */
export async function revokeApiKey(
  groupId: number,
  uuid: string,
): Promise<MarketingApiKey | null> {
  const { data } = await api.delete<
    SpaApiResponse<{ api_key?: MarketingApiKey } | MarketingApiKey | null>
  >(`${basePath(groupId)}/${uuid}`);
  const unwrapped = unwrap(data);
  if (!unwrapped) return null;
  if ("api_key" in unwrapped) {
    return (unwrapped as { api_key?: MarketingApiKey }).api_key ?? null;
  }
  return unwrapped as MarketingApiKey;
}

const marketingApiKeysService = {
  listApiKeys,
  createApiKey,
  updateApiKey,
  rotateApiKey,
  revokeApiKey,
  resolveGroupIdFromWorkspaceKey,
  normalizeMarketingApiKeyError,
  isMarketingApiKeyError,
};

export default marketingApiKeysService;
