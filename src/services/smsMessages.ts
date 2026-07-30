import api from "./base.js";
import type { SmsDirectSendPayload, SmsMessage } from "@/contracts/smsMessages";

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

const smsMessagesService = {
  sendSmsMessage,
};

export default smsMessagesService;
