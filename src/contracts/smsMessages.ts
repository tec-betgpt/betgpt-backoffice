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
