import { defineStore } from "pinia";
import {
  getCampaignTimeline,
  getContactTimeline,
  getRecipientTimeline,
} from "@/services/observability";
import type {
  CanonicalEvent,
  TimelineQueryParams,
} from "@/contracts/observability";

export const useTimelineStore = defineStore("timeline", {
  state: () => ({
    events: [] as CanonicalEvent[],
    loading: false,
    error: null as string | null,
    hasMore: false,
    currentSince: null as string | null,
  }),
  actions: {
    reset() {
      this.events = [];
      this.error = null;
      this.hasMore = false;
      this.currentSince = null;
    },

    async fetchContactTimeline(
      projectId: number,
      contact: string,
      opts: TimelineQueryParams = {},
      append = false,
    ) {
      this.loading = true;
      this.error = null;

      try {
        const response = await getContactTimeline(contact, {
          project_id: projectId,
          ...opts,
        });

        const incoming = response.data ?? [];
        this.events = append ? [...this.events, ...incoming] : incoming;
        this.hasMore = incoming.length >= (opts.limit ?? 50);
        this.currentSince = incoming.length
          ? incoming[incoming.length - 1].occurred_at
          : this.currentSince;

        return incoming;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCampaignTimeline(
      campaignId: number,
      projectId: number,
      opts: TimelineQueryParams = {},
      append = false,
    ) {
      this.loading = true;
      this.error = null;

      try {
        const response = await getCampaignTimeline(campaignId, projectId, opts);

        const incoming = response.data ?? [];
        this.events = append ? [...this.events, ...incoming] : incoming;
        this.hasMore = incoming.length >= (opts.limit ?? 100);
        this.currentSince = incoming.length
          ? incoming[incoming.length - 1].occurred_at
          : this.currentSince;

        return incoming;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchRecipientTimeline(
      recipientId: number,
      projectId: number,
      opts: TimelineQueryParams = {},
      append = false,
    ) {
      this.loading = true;
      this.error = null;

      try {
        const response = await getRecipientTimeline(recipientId, projectId, opts);

        const incoming = response.data ?? [];
        this.events = append ? [...this.events, ...incoming] : incoming;
        this.hasMore = incoming.length >= (opts.limit ?? 50);
        this.currentSince = incoming.length
          ? incoming[incoming.length - 1].occurred_at
          : this.currentSince;

        return incoming;
      } catch (error) {
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});

function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    if (response?.status === 403) return "Você não tem acesso a este projeto/workspace.";
    return response?.data?.message ?? "Não foi possível carregar a timeline.";
  }
  return "Não foi possível carregar a timeline.";
}
