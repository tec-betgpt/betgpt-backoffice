import { h } from "vue";
import i18n from "@/i18n";
import { useToast } from "@/components/ui/toast/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { normalizeApiError } from "@/lib/apiError";
import type { NormalizedApiError } from "@/lib/apiError";

/**
 * Feedback operacional padronizado de erros (Fase 6, tarefa 7).
 *
 * Mapeia `data.code`/status para mensagens específicas e, quando o backend
 * envia `request_id`/`X-Request-ID`, oferece ação para copiar o identificador
 * de suporte. Mensagens de sucesso nunca são afetadas.
 */

const CODE_MESSAGE_KEYS: Record<string, string> = {
  invalid_scopes: "api_errors.code_invalid_scopes",
  wildcard_scope_not_allowed: "api_errors.code_wildcard_scope_not_allowed",
  empty_scopes: "api_errors.code_empty_scopes",
  invalid_rate_limit: "api_errors.code_invalid_rate_limit",
  invalid_expiration: "api_errors.code_invalid_expiration",
  invalid_name: "api_errors.code_invalid_name",
  immutable_fields: "api_errors.code_immutable_fields",
  state_conflict: "api_errors.state_conflict",
  idempotency_key_reused: "api_errors.idempotency_key_reused",
  idempotency_conflict: "api_errors.idempotency_conflict",
  invalid_transition: "api_errors.invalid_transition",
};

/** Resolve a mensagem apresentável a partir do erro normalizado. */
export function resolveApiErrorMessage(
  error: NormalizedApiError,
  fallbackKey = "api_errors.generic",
): string {
  const t = i18n.global.t;

  if (error.status === 403) return t("api_errors.forbidden");

  if (error.status === 429) {
    return error.retryAfterSeconds
      ? t("api_errors.rate_limited", { seconds: error.retryAfterSeconds })
      : t("api_errors.rate_limited_generic");
  }

  // Resultado indeterminado (sem resposta): orienta consultar antes de
  // reenviar — nunca reenviar comandos nesse estado com uma nova chave.
  if (error.isNetworkError) return t("api_errors.indeterminate");

  if (error.code && CODE_MESSAGE_KEYS[error.code]) {
    return t(CODE_MESSAGE_KEYS[error.code]);
  }

  if (error.message) {
    // Nas rotas da SPA a `message` costuma ser uma chave i18n; quando não é,
    // exibe o texto bruto do backend.
    const translated = t(error.message);
    return translated !== error.message ? translated : error.message;
  }

  return t(fallbackKey);
}

async function copyRequestId(requestId: string) {
  const { toast } = useToast();
  const t = i18n.global.t;

  try {
    await navigator.clipboard.writeText(requestId);
    toast({ description: t("api_errors.request_id_copied") });
  } catch {
    // Clipboard indisponível (contexto inseguro): o ID já está visível no
    // corpo do toast para cópia manual.
  }
}

export interface ApiErrorToastOptions {
  /** Título do toast (padrão: "Algo deu errado"). */
  title?: string;
  /** Chave i18n de fallback quando não há mensagem/código conhecido. */
  fallbackKey?: string;
}

/**
 * Exibe toast de erro padronizado. Inclui o `request_id` no corpo e uma ação
 * "Copiar ID" quando o identificador está disponível.
 */
export function showApiErrorToast(
  error: unknown,
  options: ApiErrorToastOptions = {},
): void {
  const normalized = normalizeApiError(error);
  const { toast } = useToast();
  const t = i18n.global.t;

  const message = resolveApiErrorMessage(normalized, options.fallbackKey);
  const description = normalized.requestId
    ? `${message}\n${t("api_errors.request_id_label")}: ${normalized.requestId}`
    : message;

  toast({
    title: options.title ?? t("api_errors.generic_title"),
    description,
    variant: "destructive",
    ...(normalized.requestId
      ? {
          action: h(
            ToastAction,
            {
              altText: t("api_errors.copy_request_id"),
              onClick: () => copyRequestId(normalized.requestId as string),
            },
            { default: () => t("api_errors.copy_request_id") },
          ),
        }
      : {}),
  });
}
