import axios from "axios";

/**
 * Normalização de erros da API (Fase 6, tarefa 7).
 *
 * Dois envelopes em uso:
 * - SPA (rotas atuais): `{ success: false, message, data: { code } }`.
 * - Fachada pública (integrações): `{ error: { code, message, details }, request_id }`.
 *
 * `X-Request-ID`/`request_id` são lidos quando presentes — nunca exigidos.
 */

export type ApiErrorEnvelope = "spa" | "public" | "unknown";

export interface NormalizedApiError {
  /** HTTP status ou null em erro de rede. */
  status: number | null;
  /** Código estável (`data.code` na SPA, `error.code` na fachada pública). */
  code: string | null;
  /** Mensagem enviada pelo backend (pode ser chave i18n nas rotas da SPA). */
  message: string | null;
  /** `error.details` da fachada pública, quando presente. */
  details: unknown;
  /** Identificador copiável para suporte (`request_id` / `X-Request-ID`). */
  requestId: string | null;
  /** Segundos do header `Retry-After` (429 e `idempotency_conflict`). */
  retryAfterSeconds: number | null;
  envelope: ApiErrorEnvelope;
  /** Sem resposta do servidor: resultado indeterminado. */
  isNetworkError: boolean;
}

function headerRequestId(headers: unknown): string | null {
  const value = (headers as Record<string, unknown> | undefined)?.["x-request-id"];
  return typeof value === "string" ? value : null;
}

function parseRetryAfter(headers: unknown): number | null {
  const seconds = Number(
    (headers as Record<string, unknown> | undefined)?.["retry-after"],
  );
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/** Aceita erro do axios, erro genérico ou objeto já parcialmente normalizado. */
export function normalizeApiError(error: unknown): NormalizedApiError {
  // Objeto já normalizado por outra camada (ex.: stores que guardam o erro).
  if (
    error &&
    typeof error === "object" &&
    !axios.isAxiosError(error) &&
    ("status" in error || "code" in error) &&
    "message" in error
  ) {
    const normalized = error as Partial<NormalizedApiError>;
    return {
      status: normalized.status ?? null,
      code: normalized.code ?? null,
      message: normalized.message ?? null,
      details: normalized.details ?? null,
      requestId: normalized.requestId ?? null,
      retryAfterSeconds: normalized.retryAfterSeconds ?? null,
      envelope: normalized.envelope ?? "unknown",
      isNetworkError: normalized.isNetworkError ?? false,
    };
  }

  if (!axios.isAxiosError(error)) {
    return {
      status: null,
      code: null,
      message: error instanceof Error ? error.message : String(error),
      details: null,
      requestId: null,
      retryAfterSeconds: null,
      envelope: "unknown",
      isNetworkError: false,
    };
  }

  const status = error.response?.status ?? null;
  const body = error.response?.data as Record<string, unknown> | undefined;
  const headers = error.response?.headers;
  const retryAfterSeconds = parseRetryAfter(headers);

  // Fachada pública: `{ error: { code, message, details }, request_id }`.
  if (body && typeof body === "object" && body.error && typeof body.error === "object") {
    const publicError = body.error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
    };
    return {
      status,
      code: typeof publicError.code === "string" ? publicError.code : null,
      message:
        typeof publicError.message === "string" ? publicError.message : null,
      details: publicError.details ?? null,
      requestId:
        typeof body.request_id === "string"
          ? body.request_id
          : headerRequestId(headers),
      retryAfterSeconds,
      envelope: "public",
      isNetworkError: false,
    };
  }

  // SPA: `{ success: false, message, data: { code } }`.
  if (body && typeof body === "object") {
    const data = body.data as { code?: unknown } | undefined;
    return {
      status,
      code: typeof data?.code === "string" ? data.code : null,
      message: typeof body.message === "string" ? body.message : null,
      details: null,
      requestId: headerRequestId(headers),
      retryAfterSeconds,
      envelope: "spa",
      isNetworkError: false,
    };
  }

  return {
    status,
    code: null,
    message: error.message,
    details: null,
    requestId: headerRequestId(headers),
    retryAfterSeconds,
    envelope: "unknown",
    isNetworkError: !error.response,
  };
}

/**
 * Snapshot seguro para telemetry/relatórios de erro.
 *
 * NUNCA inclui headers (`Authorization`, `Idempotency-Key`), payload/body
 * (que pode conter secrets ou conteúdo de SMS) — apenas o mínimo para
 * correlacionar a falha com os logs do backend.
 */
export function sanitizeErrorForTelemetry(
  error: unknown,
): Record<string, unknown> {
  const normalized = normalizeApiError(error);
  return {
    status: normalized.status,
    code: normalized.code,
    envelope: normalized.envelope,
    requestId: normalized.requestId,
  };
}
