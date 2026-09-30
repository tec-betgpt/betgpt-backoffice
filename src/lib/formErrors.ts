import axios from "axios";

/**
 * Extração de erros de validação (422) para formulários.
 *
 * O interceptor global em `src/services/base.ts` já exibe o toast do 422;
 * este módulo apenas mapeia os erros de campo para exibição inline — nunca
 * emite toast. Tolera os três envelopes em uso:
 * - Padronizado: `{ success: false, message, errors: { campo: ["msg"] } }`.
 * - Legado (`validatorResponse`): `{ success: false, message, data: { campo: "msg" } }`.
 * - Padrão Laravel: `{ message, errors: { campo: ["msg"] } }`.
 */

export interface ExtractedFormErrors {
  /** Primeira mensagem de cada campo. */
  fieldErrors: Record<string, string>;
  /** Mensagem geral enviada pelo backend (ou fallback genérico). */
  generalMessage: string;
}

const GENERIC_MESSAGE = "Verifique os campos destacados e tente novamente.";

function isFieldErrorMap(
  value: unknown,
): value is Record<string, string | string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const entries = Object.values(value as Record<string, unknown>);
  return (
    entries.length > 0 &&
    entries.every((item) => typeof item === "string" || Array.isArray(item))
  );
}

/**
 * Retorna os erros de campo quando `err` é um 422 do axios com um objeto de
 * erros não vazio; caso contrário retorna `null`.
 */
export function extractFormErrors(err: unknown): ExtractedFormErrors | null {
  if (!axios.isAxiosError(err)) return null;

  const response = err.response;
  if (!response || response.status !== 422) return null;

  const body = response.data as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return null;

  let errors: unknown = body.errors;
  if (!isFieldErrorMap(errors) && isFieldErrorMap(body.data)) {
    errors = body.data;
  }
  if (!isFieldErrorMap(errors)) return null;

  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(errors)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first == null) continue;
    fieldErrors[field] = typeof first === "string" ? first : String(first);
  }

  if (!Object.keys(fieldErrors).length) return null;

  const generalMessage =
    typeof body.message === "string" && body.message
      ? body.message
      : GENERIC_MESSAGE;

  return { fieldErrors, generalMessage };
}
