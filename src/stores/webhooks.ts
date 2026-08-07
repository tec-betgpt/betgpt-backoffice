import { defineStore } from "pinia";
import {
  getIncomingWebhooks,
  getWebhookDeliveryLogs,
  getWebhookOutbox,
  replayWebhookOutbox,
} from "@/services/observability";
import type {
  IncomingWebhooksResponse,
  OutboxItem,
  PaginatedResponse,
  WebhookDeliveryLog,
} from "@/contracts/observability";

export const useWebhooksStore = defineStore("webhooks", {
  state: () => ({
    outbox: null as PaginatedResponse<OutboxItem> | null,
    logs: null as PaginatedResponse<WebhookDeliveryLog> | null,
    incoming: null as IncomingWebhooksResponse | null,
    loading: false,
    replaying: false,
    error: null as string | null,
  }),
  actions: {
    async fetchOutbox(projectId: number, params: Record<string, string | number | boolean> = {}) {
      this.loading = true;
      this.error = null;

      try {
        this.outbox = await getWebhookOutbox(projectId, params);
        return this.outbox;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchDeliveryLogs(projectId: number, params: Record<string, string | number | boolean> = {}) {
      this.loading = true;
      this.error = null;

      try {
        this.logs = await getWebhookDeliveryLogs(projectId, params);
        return this.logs;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchIncoming(projectId: number, params: Record<string, string | number | boolean> = {}) {
      this.loading = true;
      this.error = null;

      try {
        this.incoming = await getIncomingWebhooks(projectId, params);
        return this.incoming;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async replayOutbox(ids: number[]) {
      this.replaying = true;
      this.error = null;

      try {
        const response = await replayWebhookOutbox(ids);
        return response;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.replaying = false;
      }
    },

    reset() {
      this.outbox = null;
      this.logs = null;
      this.incoming = null;
      this.loading = false;
      this.replaying = false;
      this.error = null;
    },
  },
});

function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    if (response?.status === 403) return "Você não tem acesso a este projeto/workspace.";
    return response?.data?.message ?? "Não foi possível carregar os webhooks.";
  }
  return "Não foi possível carregar os webhooks.";
}
