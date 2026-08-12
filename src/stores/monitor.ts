import { defineStore } from "pinia";
import { getCampaignForecast, getCampaignMonitor } from "@/services/observability";
import type { CampaignForecast, CampaignMonitor } from "@/contracts/observability";

export const useMonitorStore = defineStore("monitor", {
  state: () => ({
    monitor: null as CampaignMonitor | null,
    forecast: null as CampaignForecast | null,
    loading: false,
    lastUpdatedAt: null as Date | null,
    error: null as string | null,
  }),
  actions: {
    async fetchMonitor(campaignId: number, projectId: number, force = false) {
      if (this.loading && !force) return;

      this.loading = true;
      this.error = null;

      try {
        this.monitor = await getCampaignMonitor(campaignId, projectId);
        this.lastUpdatedAt = new Date();
        if (this.monitor?.forecast) {
          this.forecast = this.monitor.forecast;
        }
        return this.monitor;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchForecast(campaignId: number, projectId: number) {
      this.error = null;

      try {
        const response = await getCampaignForecast(campaignId, projectId);
        this.forecast = response.forecast;
        return this.forecast;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      }
    },

    reset() {
      this.monitor = null;
      this.forecast = null;
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
    return response?.data?.message ?? "Não foi possível carregar o monitor.";
  }
  return "Não foi possível carregar o monitor.";
}
