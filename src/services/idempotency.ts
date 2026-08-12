import axios from "axios";
import api from "./base";

/**
 * Idempotência e correlação nas ações da SPA (Fase 6).
 *
 * O backend mantém o middleware `idempotency` em modo opcional nas rotas da
 * SPA: a deduplicação ativa quando o header `Idempotency-Key` é enviado.
 *
 * Regras implementadas aqui:
 * - Uma chave por intenção do usuário (gerada na entrada da action, nunca a
 *   cada retry/interceptor).
 * - Retry automático da mesma intenção (timeout, erro de conexão) reutiliza a
 *   MESMA chave e o MESMO payload.
 * - Duplo clique/submit da mesma operação em andamento compartilha a mesma
 *   Promise — nenhuma requisição duplicada sai do client.
 * - `409 idempotency_key_reused`: nunca repetir automaticamente.
 * - `409 idempotency_conflict` (operação em andamento): aguarda `Retry-After`
 *   e tenta novamente com a mesma chave (limite de tentativas).
 * - Replay do backend (`Idempotency-Replayed: true`) chega como 2xx idêntico
 *   à resposta original — segue o fluxo normal de sucesso.
 * - Nenhuma chave é persistida: o mapa em memória guarda apenas operações em
 *   andamento e é limpo ao final de cada uma.
 */

const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
const CORRELATION_ID_HEADER = "X-Correlation-ID";
const REQUEST_ID_HEADER = "x-request-id";

const MAX_NETWORK_RETRIES = 1;
const MAX_CONFLICT_RETRIES = 2;
const NETWORK_RETRY_DELAY_MS = 500;
const DEFAULT_CONFLICT_DELAY_MS = 1000;
const MAX_CONFLICT_DELAY_MS = 10_000;

/**
 * Gera um identificador por intenção do usuário. UUID v4 atende ao charset
 * `[A-Za-z0-9._:-]` com 36 caracteres (máx. 128 exigido pelo backend).
 */
export function generateIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 12)}`;
}

/** Correlation ID por fluxo operacional (ex.: sequência preparar → lançar). */
export function generateCorrelationId(): string {
  return generateIdempotencyKey();
}

/** Código estável de erro do envelope SPA (`data.code`), quando presente. */
export function getSpaErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const code = (error.response?.data as { data?: { code?: unknown } } | undefined)
    ?.data?.code;
  return typeof code === "string" ? code : null;
}

/**
 * `X-Request-ID` do backend, quando presente (fachada pública e respostas que
 * o incluírem). Retorna null nas rotas da SPA sem o header — nunca exigido.
 */
export function getRequestId(source: unknown): string | null {
  if (!axios.isAxiosError(source)) {
    const headers = (source as { headers?: Record<string, unknown> } | null)
      ?.headers;
    const value = headers?.[REQUEST_ID_HEADER];
    return typeof value === "string" ? value : null;
  }
  const value = source.response?.headers?.[REQUEST_ID_HEADER];
  return typeof value === "string" ? value : null;
}

function isNetworkOrTimeout(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return (
    error.code === "ERR_NETWORK" || error.code === "ECONNABORTED" || !error.response
  );
}

function retryAfterMs(error: unknown): number {
  if (!axios.isAxiosError(error)) return DEFAULT_CONFLICT_DELAY_MS;
  const header = error.response?.headers?.["retry-after"];
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_CONFLICT_DELAY_MS;
  return Math.min(seconds * 1000, MAX_CONFLICT_DELAY_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Operações em andamento por (rota + payload) — apenas para deduplicar. */
const inFlight = new Map<string, Promise<unknown>>();

export interface IdempotentRequestOptions {
  /** Correlation ID do fluxo operacional; um novo é gerado quando omitido. */
  correlationId?: string;
}

/**
 * POST idempotente para as rotas da SPA com o motor de idempotency ligado:
 * `campaigns.create`, `campaigns.prepare|launch|pause|resume|cancel`,
 * `links.create` e `sms.send`.
 *
 * Retorna o corpo da resposta (`response.data`), como `api.post` faria.
 */
export async function postWithIdempotency<T>(
  url: string,
  body?: unknown,
  options: IdempotentRequestOptions = {},
): Promise<T> {
  const fingerprint = `POST ${url}:${JSON.stringify(body ?? null)}`;

  // Duplo clique da mesma intenção: compartilha a operação em andamento.
  const pending = inFlight.get(fingerprint);
  if (pending) return pending as Promise<T>;

  const promise = executeWithRetries<T>(url, body, options).finally(() => {
    inFlight.delete(fingerprint);
  });

  inFlight.set(fingerprint, promise);
  return promise;
}

async function executeWithRetries<T>(
  url: string,
  body: unknown,
  options: IdempotentRequestOptions,
): Promise<T> {
  // Uma chave por intenção — todos os retries abaixo reutilizam esta chave.
  const idempotencyKey = generateIdempotencyKey();
  const correlationId = options.correlationId ?? generateCorrelationId();

  let networkAttempts = 0;
  let conflictAttempts = 0;

  for (;;) {
    try {
      const response = await api.post<T>(url, body, {
        headers: {
          [IDEMPOTENCY_KEY_HEADER]: idempotencyKey,
          [CORRELATION_ID_HEADER]: correlationId,
        },
      });
      return response.data;
    } catch (error) {
      const code = getSpaErrorCode(error);

      // Chave reutilizada com payload divergente: erro definitivo, sem retry.
      if (code === "idempotency_key_reused") throw error;

      // Operação em andamento no backend: aguarda Retry-After e reenvia a
      // mesma intenção (mesma chave e payload).
      if (code === "idempotency_conflict" && conflictAttempts < MAX_CONFLICT_RETRIES) {
        conflictAttempts += 1;
        await sleep(retryAfterMs(error));
        continue;
      }

      // Timeout/erro de conexão: resultado indeterminado — repete UMA vez com
      // a mesma chave (o backend deduplica se a original tiver sido aplicada).
      if (isNetworkOrTimeout(error) && networkAttempts < MAX_NETWORK_RETRIES) {
        networkAttempts += 1;
        await sleep(NETWORK_RETRY_DELAY_MS);
        continue;
      }

      throw error;
    }
  }
}
