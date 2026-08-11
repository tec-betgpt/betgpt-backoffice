/**
 * Contratos da administração de API keys de projeto (gateway público).
 *
 * Regras de segurança do contrato:
 * - `ProjectApiKey` NUNCA contém `secret`, hash ou abilities cruas.
 * - O bearer completo só existe em `IssuedProjectApiKeyResponse` /
 *   `RotatedProjectApiKeyResponse` (campo `secret`, exibido uma única vez) e
 *   não deve ser persistido (localStorage, sessionStorage, Pinia persistido,
 *   logs, telemetry ou query string).
 */

import type { SpaApiResponse } from "./marketingApiKeys";

// Reuso do envelope da SPA — não duplicar contrato.
export type { SpaApiResponse };

// ---------------------------------------------------------------------------
// Status, scopes e constantes de validação
// ---------------------------------------------------------------------------

export type ProjectApiKeyStatus = "active" | "revoked" | "expired";

export type ProjectApiKeyRotationPolicy = "immediate" | "overlap";

/**
 * Catálogo fechado de scopes (backend: App\Enums\MarketingApiScope).
 * Qualquer valor fora desta lista retorna 422 `invalid_scopes`; `*` retorna
 * 422 `wildcard_scope_not_allowed`.
 */
export const PROJECT_API_SCOPES = [
  "campaigns:read",
  "campaigns:write",
  "campaigns:execute",
  "links:read",
  "links:write",
  "sms:read",
  "sms:send",
  "financial:read",
  "conversions:write",
  "optouts:write",
] as const;

export type ProjectApiScope = (typeof PROJECT_API_SCOPES)[number];

export type ProjectApiScopeDomain =
  | "campaigns"
  | "links"
  | "sms"
  | "financial"
  | "events";

export interface ProjectApiScopeGroup {
  domain: ProjectApiScopeDomain;
  scopes: ProjectApiScope[];
}

/** Catálogo agrupado por domínio, usado pelo formulário de emissão/edição. */
export const PROJECT_API_SCOPE_GROUPS: readonly ProjectApiScopeGroup[] = [
  {
    domain: "campaigns",
    scopes: ["campaigns:read", "campaigns:write", "campaigns:execute"],
  },
  { domain: "links", scopes: ["links:read", "links:write"] },
  { domain: "sms", scopes: ["sms:read", "sms:send"] },
  { domain: "financial", scopes: ["financial:read"] },
  { domain: "events", scopes: ["conversions:write", "optouts:write"] },
] as const;

export const PROJECT_API_KEY_NAME_MIN_LENGTH = 3;
export const PROJECT_API_KEY_NAME_MAX_LENGTH = 100;
export const PROJECT_API_KEY_RATE_LIMIT_MIN = 1;
export const PROJECT_API_KEY_RATE_LIMIT_MAX = 600;
export const PROJECT_API_KEY_RATE_LIMIT_DEFAULT = 60;

// ---------------------------------------------------------------------------
// Entidade (shape mascarado — listagem e detalhe)
// ---------------------------------------------------------------------------

export interface ProjectApiKeyActor {
  id: number;
  name: string;
}

export interface ProjectApiKey {
  uuid: string;
  name: string;
  /** Prefixo mascarado da chave (ex.: `pk_a1b2c3d4`). Nunca é o bearer. */
  key_prefix: string;
  status: ProjectApiKeyStatus;
  scopes: ProjectApiScope[];
  /** Requisições por minuto (1–600, default 60). */
  rate_limit_per_minute: number;
  /** ISO 8601, nullable. */
  expires_at: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
  created_by: ProjectApiKeyActor | null;
  revoked_at: string | null;
  revoked_by: ProjectApiKeyActor | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Payloads administrativos
// ---------------------------------------------------------------------------

export interface IssueProjectApiKeyRequest {
  /** 3–100 caracteres. */
  name: string;
  /** Catálogo fechado; não enviar vazio (`empty_scopes`) nem `*`. */
  scopes: ProjectApiScope[];
  /** 1–600; backend assume 60 quando omitido. */
  rate_limit_per_minute?: number;
  /** ISO 8601 futura; null = sem expiração. */
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Edição (`PATCH`): somente estes campos são aceitos. Projeto, `uuid`,
 * `status` e atores são imutáveis — qualquer outro campo retorna 422
 * `immutable_fields`.
 */
export interface UpdateProjectApiKeyRequest {
  name?: string;
  scopes?: ProjectApiScope[];
  rate_limit_per_minute?: number;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Respostas de emissão/rotação (secret exibido uma única vez)
// ---------------------------------------------------------------------------

/** Resposta de criação (`201`): chave mascarada + secret de exibição única. */
export interface IssuedProjectApiKeyResponse {
  api_key: ProjectApiKey;
  /** Bearer completo. Exibido uma única vez; nunca persistir. */
  secret: string;
  secret_displayed_once: true;
}

/** Resposta de rotação (`200`): emissão + política de transição do secret. */
export interface RotatedProjectApiKeyResponse
  extends IssuedProjectApiKeyResponse {
  rotation_policy: ProjectApiKeyRotationPolicy;
  /** ISO 8601 até quando o secret anterior permanece válido (policy `overlap`). */
  previous_secret_valid_until: string | null;
}

// ---------------------------------------------------------------------------
// Erros estáveis
// ---------------------------------------------------------------------------

/**
 * Códigos estáveis retornados em `data.code` nas respostas de erro.
 * 403 (não autorizado) chega sem `code`; 404 indica UUID de outro projeto.
 */
export const PROJECT_API_KEY_ERROR_CODES = [
  "invalid_scopes",
  "wildcard_scope_not_allowed",
  "empty_scopes",
  "invalid_rate_limit",
  "invalid_expiration",
  "invalid_name",
  "immutable_fields",
  "state_conflict",
] as const;

export type ProjectApiKeyErrorCode =
  (typeof PROJECT_API_KEY_ERROR_CODES)[number];

/** Erro normalizado pelo client para consumo da store/UI. */
export interface ProjectApiKeyError {
  /** HTTP status (403, 404, 409, 422...) ou null em erro de rede. */
  status: number | null;
  /** Código estável de `data.code`, quando presente. */
  code: ProjectApiKeyErrorCode | null;
  message: string;
}
