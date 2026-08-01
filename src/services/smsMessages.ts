import api from "./base.js";
import { postWithIdempotency } from "./idempotency";
import type {
  SmsDirectSendPayload,
  SmsMessage,
  SmsMessageDetail,
  SmsMessageEvent,
  SmsMessagesFilters,
  SmsMessagesListResponse,
  SmsRecipientDispatchesResponse,
  SmsStatusSyncResponse,
} from "@/contracts/smsMessages";

type Envelope<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

/**
 * POST /v1/channels/sms/messages
 * Envio direto de SMS pelo provider comercial elevate-sms.
 * 201 → mensagem aceita/enfileirada. Mesmo em erros 4xx/5xx de envio, o
 * backend persiste a mensagem com status `failed` (ver histórico).
 */
export async function sendSmsMessage(payload: SmsDirectSendPayload): Promise<SmsMessage> {
  const data = await postWithIdempotency<Envelope<SmsMessage>>("/channels/sms/messages", payload);
  return data.data;
}

/**
 * GET /v1/channels/sms/recipients/{recipient_id}/dispatches
 * Detalhe do vínculo do recipient de campanha com o envio real no supplier:
 * resumo do recipient + histórico de tentativas (cada retry vira uma linha).
 * 404 → recipient inexistente ou sem permissão.
 */
export async function getSmsRecipientDispatches(
  recipientId: number,
): Promise<SmsRecipientDispatchesResponse> {
  const { data } = await api.get<Envelope<SmsRecipientDispatchesResponse>>(
    `/channels/sms/recipients/${recipientId}/dispatches`,
  );
  return data.data;
}

/**
 * GET /v1/channels/sms/messages
 * Listagem paginada do histórico de envios diretos.
 * `project_id` é obrigatório (422 sem ele); `requested_to` deve ser >= `requested_from`.
 */
export async function listSmsMessages(
  filters: SmsMessagesFilters,
): Promise<SmsMessagesListResponse> {
  const { data } = await api.get<Envelope<SmsMessagesListResponse>>("/channels/sms/messages", {
    params: filters,
  });
  return data.data;
}

/**
 * GET /v1/channels/sms/messages/{id}
 * Detalhe consolidado da mensagem.
 */
export async function getSmsMessage(id: number): Promise<SmsMessageDetail> {
  const { data } = await api.get<Envelope<SmsMessageDetail>>(`/channels/sms/messages/${id}`);
  return data.data;
}

/**
 * GET /v1/channels/sms/messages/{id}/events
 * Timeline cronológica de eventos (request, callback, manual_status_check).
 */
export async function getSmsMessageEvents(id: number): Promise<SmsMessageEvent[]> {
  const { data } = await api.get<Envelope<SmsMessageEvent[]>>(
    `/channels/sms/messages/${id}/events`,
  );
  return data.data;
}

/**
 * POST /v1/channels/sms/status-sync
 * Consulta manual de status no supplier.
 * outcome: updated | unchanged | ignored_regression.
 * 422 → mensagem sem identificador externo (nunca chegou ao supplier).
 */
export async function syncSmsMessageStatus(smsMessageId: number): Promise<SmsStatusSyncResponse> {
  const { data } = await api.post<Envelope<SmsStatusSyncResponse>>("/channels/sms/status-sync", {
    sms_message_id: smsMessageId,
  });
  return data.data;
}

const smsMessagesService = {
  sendSmsMessage,
  getSmsRecipientDispatches,
  listSmsMessages,
  getSmsMessage,
  getSmsMessageEvents,
  syncSmsMessageStatus,
};

export default smsMessagesService;