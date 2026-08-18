/**
 * Contrato da integração comercial de SMS "elevate-sms" (Fase 4).
 * O supplier (smsfunnel) é detalhe técnico interno e nunca é exposto na UI.
 *
 * Endpoints dedicados:
 *   GET /v1/projects/{project_id}/integrations/elevate-sms
 *   PUT /v1/projects/{project_id}/integrations/elevate-sms
 */

export const ELEVATE_SMS_PROVIDER_SLUG = "elevate-sms";
export const ELEVATE_SMS_SUPPLIER_SLUG = "smsfunnel";

/**
 * Configuração persistida. No GET, `api_key` vem mascarada
 * (ex.: `abcd********5678`; chaves com até 8 chars vêm só com `*`).
 */
export interface ElevateSmsIntegrationConfig {
  provider_slug: string;
  supplier_slug: string;
  api_key: string;
  email: string;
  is_active: boolean;
  sender: string | null;
  status_callback_url: string | null;
  metadata: Record<string, unknown> | null;
  /**
   * URL completa do webhook com o token em claro. Presente apenas na resposta
   * do primeiro upsert (exibição única); nunca retorna no GET nem em upserts
   * seguintes — `metadata.callback_token`/`callback_secret` vêm mascarados.
   */
  callback_url?: string | null;
}

/**
 * Resposta do POST .../callback-token/rotate. O novo token invalida o anterior
 * imediatamente e é exibido em claro uma única vez.
 */
export interface ElevateSmsCallbackTokenRotation {
  callback_token: string;
  callback_url: string;
}

/**
 * Payload do upsert (PUT). Regra crítica: para edição sem troca de chave,
 * reenviar o valor mascarado como veio — o backend detecta o `*` e preserva
 * a chave real já gravada.
 */
export interface ElevateSmsIntegrationPayload {
  provider_slug: string;
  supplier_slug: string;
  api_key: string;
  email: string;
  is_active: boolean;
  sender?: string | null;
  status_callback_url?: string | null;
  metadata?: Record<string, unknown>;
}
