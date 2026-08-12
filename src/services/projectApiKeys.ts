import axios from "axios";
import api from "./base";
import type {
  IssuedProjectApiKeyResponse,
  IssueProjectApiKeyRequest,
  ProjectApiKey,
  ProjectApiKeyError,
  ProjectApiKeyErrorCode,
  RotatedProjectApiKeyResponse,
  SpaApiResponse,
  UpdateProjectApiKeyRequest,
} from "@/contracts/projectApiKeys";
import { PROJECT_API_KEY_ERROR_CODES } from "@/contracts/projectApiKeys";

function basePath(projectId: number | string): string {
  return `/projects/${projectId}/api-keys`;
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
export function normalizeProjectApiKeyError(
  error: unknown,
): ProjectApiKeyError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const body = error.response?.data as
      | { message?: string; data?: { code?: string } }
      | undefined;
    const rawCode = body?.data?.code;
    const code = PROJECT_API_KEY_ERROR_CODES.includes(
      rawCode as ProjectApiKeyErrorCode,
    )
      ? (rawCode as ProjectApiKeyErrorCode)
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
export function isProjectApiKeyError(
  error: unknown,
  code: ProjectApiKeyErrorCode,
): boolean {
  return normalizeProjectApiKeyError(error).code === code;
}

/** GET /v1/projects/{projectId}/api-keys — array sem paginação. */
export async function listProjectApiKeys(
  projectId: number | string,
): Promise<ProjectApiKey[]> {
  const { data } = await api.get<SpaApiResponse<ProjectApiKey[]>>(
    basePath(projectId),
  );
  return unwrap(data);
}

/** POST /v1/projects/{projectId}/api-keys — `201` com secret único. */
export async function createProjectApiKey(
  projectId: number | string,
  payload: IssueProjectApiKeyRequest,
): Promise<IssuedProjectApiKeyResponse> {
  const { data } = await api.post<SpaApiResponse<IssuedProjectApiKeyResponse>>(
    basePath(projectId),
    payload,
  );
  return unwrap(data);
}

/** PATCH /v1/projects/{projectId}/api-keys/{uuid} */
export async function updateProjectApiKey(
  projectId: number | string,
  uuid: string,
  payload: UpdateProjectApiKeyRequest,
): Promise<ProjectApiKey> {
  const { data } = await api.patch<
    SpaApiResponse<{ api_key: ProjectApiKey } | ProjectApiKey>
  >(`${basePath(projectId)}/${uuid}`, payload);
  const unwrapped = unwrap(data);
  return "api_key" in unwrapped ? unwrapped.api_key : unwrapped;
}

/** POST /v1/projects/{projectId}/api-keys/{uuid}/rotate */
export async function rotateProjectApiKey(
  projectId: number | string,
  uuid: string,
): Promise<RotatedProjectApiKeyResponse> {
  const { data } = await api.post<SpaApiResponse<RotatedProjectApiKeyResponse>>(
    `${basePath(projectId)}/${uuid}/rotate`,
  );
  return unwrap(data);
}

/**
 * DELETE /v1/projects/{projectId}/api-keys/{uuid}
 *
 * O registro permanece na listagem com status `revoked` (trilha de auditoria);
 * retorna a chave atualizada quando o backend a inclui na resposta.
 */
export async function revokeProjectApiKey(
  projectId: number | string,
  uuid: string,
): Promise<ProjectApiKey | null> {
  const { data } = await api.delete<
    SpaApiResponse<{ api_key?: ProjectApiKey } | ProjectApiKey | null>
  >(`${basePath(projectId)}/${uuid}`);
  const unwrapped = unwrap(data);
  if (!unwrapped) return null;
  if ("api_key" in unwrapped) {
    return (unwrapped as { api_key?: ProjectApiKey }).api_key ?? null;
  }
  return unwrapped as ProjectApiKey;
}

const projectApiKeysService = {
  listProjectApiKeys,
  createProjectApiKey,
  updateProjectApiKey,
  rotateProjectApiKey,
  revokeProjectApiKey,
  normalizeProjectApiKeyError,
  isProjectApiKeyError,
};

export default projectApiKeysService;
