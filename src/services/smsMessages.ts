import api from "./base.js";
import type {
  SmsDirectSendPayload,
  SmsMessage,
  SmsRecipientDispatchesResponse,
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
  const { data } = await api.post<Envelope<SmsMessage>>("/channels/sms/messages", payload);
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

const smsMessagesService = {
  sendSmsMessage,
  getSmsRecipientDispatches,
};

export default smsMessagesService;
