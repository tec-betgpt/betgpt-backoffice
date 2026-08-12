/**
 * Contratos da camada de canais (Channel Integration — Fase 4).
 * Envio direto e histórico técnico de SMS via provider comercial elevate-sms.
 *
 * Atenção: este ciclo de status (sms_messages) é diferente do ciclo de
 * recipients de campanha (broadcast_recipients) e do legado smsProvider.
 */

export type SmsMessageStatus =
  | "accepted"
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "failed"
  | "rejected"
  | "canceled";

/** Status terminais: não mudam mais. */
export const SMS_MESSAGE_TERMINAL_STATUSES: SmsMessageStatus[] = [
  "delivered",
  "failed",
  "rejected",
  "canceled",
];

/** Status não terminais: ainda podem transicionar. */
export const SMS_MESSAGE_PENDING_STATUSES: SmsMessageStatus[] = [
  "accepted",
  "queued",
  "processing",
  "sent",
];

export const SMS_MESSAGE_STATUS_LABELS: Record<SmsMessageStatus, string> = {
  accepted: "Aceita",
  queued: "Na fila",
  processing: "Processando",
  sent: "Enviada",
  delivered: "Entregue",
  failed: "Falha",
  rejected: "Rejeitada",
  canceled: "Cancelada",
};

/** Resposta do POST /v1/channels/sms/messages (201). */
export interface SmsMessage {
  id: number;
  uuid: string;
  status: SmsMessageStatus;
  supplier_message_id: string | null;
  supplier_dispatch_id: string | null;
  supplier_status: string | null;
  requested_at: string;
}

/** Payload do POST /v1/channels/sms/messages. */
export interface SmsDirectSendPayload {
  project_id: number | string;
  recipient_phone: string;
  message_body: string;
  metadata?: Record<string, unknown>;
}

// ----------------------------------------------------------------------
// Dispatches de recipient de campanha (Fase 4)
// GET /v1/channels/sms/recipients/{recipient_id}/dispatches
// ----------------------------------------------------------------------

/** Uma tentativa de envio ao supplier (cada retry vira uma linha). */
export interface SmsRecipientDispatch {
  id: number;
  attempt: number;
  status: string;
  supplier_message_id: string | null;
  supplier_dispatch_id: string | null;
  supplier_status: string | null;
  error_code: string | null;
  error_message: string | null;
  dispatched_at: string | null;
  responded_at: string | null;
}

/** Resumo do recipient no vínculo com o envio real. */
export interface SmsRecipientDispatchesRecipient {
  id: number;
  campaign_id: number;
  campaign_run_id: number;
  broadcast_batch_id: number | null;
  phone: string;
  status: string;
  attempts: number;
  supplier_message_id: string | null;
  last_error: string | null;
  queued_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
}

/** Resposta do GET /v1/channels/sms/recipients/{recipient_id}/dispatches. */
export interface SmsRecipientDispatchesResponse {
  recipient: SmsRecipientDispatchesRecipient;
  dispatches: SmsRecipientDispatch[];
}

// ----------------------------------------------------------------------
// Histórico técnico de SMS direto (Fase 4)
// GET /v1/channels/sms/messages | /{id} | /{id}/events | POST status-sync
// ----------------------------------------------------------------------

/** Item da listagem paginada de mensagens. */
export interface SmsMessageListItem {
  id: number;
  uuid: string;
  status: SmsMessageStatus;
  supplier_message_id: string | null;
  supplier_dispatch_id: string | null;
  supplier_status: string | null;
  requested_at: string;
}

export interface SmsMessagesPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/** Resposta do GET /v1/channels/sms/messages. */
export interface SmsMessagesListResponse {
  items: SmsMessageListItem[];
  pagination: SmsMessagesPagination;
}

/** Filtros da listagem. `project_id` é obrigatório (422 sem ele). */
export interface SmsMessagesFilters {
  project_id?: number | string | null;
  status?: SmsMessageStatus | null;
  recipient_phone?: string | null;
  requested_from?: string | null;
  requested_to?: string | null;
  supplier_message_id?: string | null;
  per_page?: number | null;
  page?: number | null;
}

/** Detalhe consolidado da mensagem (GET /v1/channels/sms/messages/{id}). */
export interface SmsMessageDetail extends SmsMessageListItem {
  project_id: number;
  project_integration_id: number | null;
  provider_slug: string | null;
  supplier_slug: string | null;
  recipient_phone: string | null;
  recipient_phone_e164: string | null;
  message_body: string | null;
  character_count: number | null;
  sms_segments: number | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  accepted_at: string | null;
  queued_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  canceled_at: string | null;
  last_status_at: string | null;
}

export type SmsMessageEventSource = "request" | "callback" | "manual_status_check";

export const SMS_MESSAGE_EVENT_SOURCE_LABELS: Record<SmsMessageEventSource, string> = {
  request: "Envio",
  callback: "Callback (webhook)",
  manual_status_check: "Consulta manual",
};

/** Evento da timeline (GET /v1/channels/sms/messages/{id}/events). */
export interface SmsMessageEvent {
  id: number;
  event_source: SmsMessageEventSource;
  normalized_status: SmsMessageStatus | null;
  supplier_status: string | null;
  supplier_event_id: string | null;
  error_code: string | null;
  error_message: string | null;
  /** Payload bruto preservado — exibir como JSON colapsável, nunca como HTML. */
  payload: Record<string, unknown> | null;
  occurred_at: string | null;
  processed_at: string | null;
}

export type SmsStatusSyncOutcome = "updated" | "unchanged" | "ignored_regression";

/** Resposta do POST /v1/channels/sms/status-sync. */
export interface SmsStatusSyncResponse {
  outcome: SmsStatusSyncOutcome;
  status: SmsMessageStatus;
  supplier_status: string | null;
  project_id: number;
}
