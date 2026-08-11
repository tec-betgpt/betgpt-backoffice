import { defineStore } from "pinia";
import { getLinkEngineClicks, getLinkEngineMonitor } from "@/services/observability";
import type { CanonicalClicks, LinkEngineMonitorResponse } from "@/contracts/observability";

export const useLinkMonitorStore = defineStore("linkMonitor", {
  state: () => ({
    monitor: null as LinkEngineMonitorResponse | null,
    clicks: null as CanonicalClicks | null,
    loading: false,
    lastUpdatedAt: null as Date | null,
    error: null as string | null,
  }),
  actions: {
    async fetchMonitor(
      projectId: number,
      params: Record<string, string | number> = {},
      force = false,
    ) {
      if (this.loading && !force) return;

      this.loading = true;
      this.error = null;

      try {
        this.monitor = await getLinkEngineMonitor(projectId, params);
        this.lastUpdatedAt = new Date();
        return this.monitor;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchClicks(
      projectId: number,
      params: Record<string, string | number> = {},
      force = false,
    ) {
      if (this.loading && !force) return;

      this.loading = true;
      this.error = null;

      try {
        this.clicks = await getLinkEngineClicks(projectId, params);
        this.lastUpdatedAt = new Date();
        return this.clicks;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    reset() {
      this.monitor = null;
      this.clicks = null;
      this.loading = false;
      this.lastUpdatedAt = null;
      this.error = null;
    },
  },
});

function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    if (response?.status === 403) return "Você não tem acesso a este projeto/workspace.";
    return response?.data?.message ?? "Não foi possível carregar o monitor de links.";
  }
  return "Não foi possível carregar o monitor de links.";
}
