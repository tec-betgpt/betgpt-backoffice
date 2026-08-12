import { defineStore } from "pinia";
import smsMessagesService from "@/services/smsMessages";
import type {
  SmsMessageDetail,
  SmsMessageEvent,
  SmsMessageListItem,
  SmsMessagesFilters,
  SmsMessagesPagination,
  SmsStatusSyncOutcome,
} from "@/contracts/smsMessages";

const DEFAULT_FILTERS: SmsMessagesFilters = {
  project_id: null,
  status: null,
  recipient_phone: null,
  requested_from: null,
  requested_to: null,
  supplier_message_id: null,
  per_page: 25,
  page: 1,
};

function extractBackendMessage(error: unknown): string | null {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (responseData && typeof responseData === "object") {
    const { errors, message } = responseData as {
      errors?: Record<string, string | string[]>;
      message?: string | null;
    };

    if (errors) {
      const fields = Object.values(errors).flatMap((value) =>
        Array.isArray(value) ? value : [value],
      );
      if (fields.length) {
        return fields.join(" ");
      }
    }

    if (message) {
      return message;
    }
  }

  return null;
}

export const useSmsHistoryStore = defineStore("smsHistory", {
  state: () => ({
    filters: { ...DEFAULT_FILTERS } as SmsMessagesFilters,
    items: [] as SmsMessageListItem[],
    pagination: { current_page: 1, per_page: 25, total: 0, last_page: 1 } as SmsMessagesPagination,
    loadingList: false,
    listError: null as string | null,
    detail: null as SmsMessageDetail | null,
    events: [] as SmsMessageEvent[],
    loadingDetail: false,
    detailError: null as string | null,
    syncing: false,
    lastSyncOutcome: null as SmsStatusSyncOutcome | null,
  }),

  getters: {
    canSync: (state) => Boolean(state.detail?.supplier_message_id),
  },

  actions: {
    async fetchMessages(filters: SmsMessagesFilters = {}) {
      this.filters = { ...this.filters, ...filters };
      this.loadingList = true;
      this.listError = null;

      try {
        const response = await smsMessagesService.listSmsMessages(this.filters);
        this.items = response.items;
        this.pagination = response.pagination;
      } catch (error) {
        this.listError =
          extractBackendMessage(error) ?? "Não foi possível carregar o histórico de SMS.";
        throw error;
      } finally {
        this.loadingList = false;
      }
    },

    async setFilters(filters: SmsMessagesFilters) {
      await this.fetchMessages({ ...filters, page: 1 });
    },

    async setPage(page: number) {
      await this.fetchMessages({ page });
    },

    async fetchDetail(id: number) {
      this.loadingDetail = true;
      this.detailError = null;
      this.detail = null;
      this.events = [];
      this.lastSyncOutcome = null;

      try {
        const [detail, events] = await Promise.all([
          smsMessagesService.getSmsMessage(id),
          smsMessagesService.getSmsMessageEvents(id),
        ]);
        this.detail = detail;
        this.events = events;
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        this.detailError =
          status === 404
            ? "Registro não encontrado ou sem acesso."
            : (extractBackendMessage(error) ?? "Não foi possível carregar o detalhe da mensagem.");
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },

    /**
     * Consulta manual de status no supplier.
     * Retorna o outcome; em `updated`, detalhe e timeline são recarregados.
     */
    async syncStatus(): Promise<SmsStatusSyncOutcome | null> {
      if (!this.detail || !this.canSync) {
        return null;
      }

      this.syncing = true;

      try {
        const result = await smsMessagesService.syncSmsMessageStatus(this.detail.id);
        this.lastSyncOutcome = result.outcome;

        if (result.outcome === "updated") {
          // Estado externo aplicado: recarregar detalhe + timeline.
          const [detail, events] = await Promise.all([
            smsMessagesService.getSmsMessage(this.detail.id),
            smsMessagesService.getSmsMessageEvents(this.detail.id),
          ]);
          this.detail = detail;
          this.events = events;
        }

        return result.outcome;
      } finally {
        this.syncing = false;
      }
    },

    clearDetail() {
      this.detail = null;
      this.events = [];
      this.detailError = null;
      this.lastSyncOutcome = null;
    },

    reset() {
      this.filters = { ...DEFAULT_FILTERS };
      this.items = [];
      this.pagination = { current_page: 1, per_page: 25, total: 0, last_page: 1 };
      this.loadingList = false;
      this.listError = null;
      this.clearDetail();
      this.loadingDetail = false;
      this.syncing = false;
    },
  },
});
