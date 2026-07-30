import { defineStore } from "pinia";
import smsMessagesService from "@/services/smsMessages";
import type { SmsDirectSendPayload, SmsMessage } from "@/contracts/smsMessages";

export type SmsDirectSendStatus = "idle" | "sending" | "success" | "error";

export type SmsDirectSendFieldErrors = Partial<
  Record<"recipient_phone" | "message_body" | "project_id", string>
>;

/** Mensagens de feedback por HTTP status, conforme contrato da Fase 4. */
const ERROR_MESSAGES_BY_HTTP_STATUS: Record<number, string> = {
  402: "Créditos de SMS insuficientes na conta.",
  404: "Integração elevate-sms não configurada/ativa neste projeto.",
  429: "Limite de envios atingido. Aguarde e tente novamente.",
  502: "Falha técnica no envio. O registro foi marcado como falho e pode ser consultado no histórico.",
};

/** Extrai o primeiro erro por campo no formato Laravel (`errors: { campo: [msgs] }`). */
function extractFieldErrors(error: unknown): SmsDirectSendFieldErrors {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (!responseData || typeof responseData !== "object") {
    return {};
  }

  const { errors } = responseData as { errors?: Record<string, string | string[]> };
  if (!errors || typeof errors !== "object") {
    return {};
  }

  const fieldErrors: SmsDirectSendFieldErrors = {};
  Object.entries(errors).forEach(([field, messages]) => {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (first && ["recipient_phone", "message_body", "project_id"].includes(field)) {
      fieldErrors[field as keyof SmsDirectSendFieldErrors] = first;
    }
  });

  return fieldErrors;
}

function extractBackendMessage(error: unknown): string | null {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (responseData && typeof responseData === "object") {
    const { message } = responseData as { message?: string | null };
    if (message) {
      return message;
    }
  }

  return null;
}

export const useSmsDirectSendStore = defineStore("smsDirectSend", {
  state: () => ({
    status: "idle" as SmsDirectSendStatus,
    result: null as SmsMessage | null,
    errorMessage: null as string | null,
    fieldErrors: {} as SmsDirectSendFieldErrors,
  }),

  getters: {
    isSending: (state) => state.status === "sending",
  },

  actions: {
    async send(payload: SmsDirectSendPayload) {
      this.status = "sending";
      this.result = null;
      this.errorMessage = null;
      this.fieldErrors = {};

      try {
        const message = await smsMessagesService.sendSmsMessage(payload);
        this.result = message;
        this.status = "success";
        return message;
      } catch (error) {
        const httpStatus = (error as { response?: { status?: number } })?.response?.status;

        if (httpStatus === 422) {
          this.fieldErrors = extractFieldErrors(error);
        }

        this.errorMessage =
          (httpStatus ? ERROR_MESSAGES_BY_HTTP_STATUS[httpStatus] : null) ??
          extractBackendMessage(error) ??
          "Não foi possível enviar a mensagem. O registro pode ser consultado no histórico.";

        this.status = "error";
        throw error;
      }
    },

    reset() {
      this.status = "idle";
      this.result = null;
      this.errorMessage = null;
      this.fieldErrors = {};
    },
  },
});
