import { defineStore } from "pinia";
import {
  getActiveCampaignSeries,
  getAuthentication,
  getCompliance,
  getDeliveryErrors,
  getEncryption,
  getFeedbackLoop,
  getOverview,
  getSpamRate,
  listDomains,
  type EmailHealthComplianceResponse,
  type EmailHealthFeedbackLoopResponse,
  type EmailHealthSeriesResponse,
  type EmailHealthSpamRateResponse,
} from "@/services/emailHealth";
import type {
  ActiveCampaignActivityResponse,
  AuthSeriesPoint,
  DeliveryErrorDay,
  EmailHealthDomain,
  EmailHealthOverview,
  EmailHealthQuery,
  EmailHealthRange,
  TlsSeriesPoint,
} from "@/contracts/emailHealth";

export type EmailHealthSectionKey =
  | "domains"
  | "overview"
  | "spamRate"
  | "compliance"
  | "feedbackLoop"
  | "authentication"
  | "encryption"
  | "deliveryErrors"
  | "activeCampaign";

type SectionLoading = Record<EmailHealthSectionKey, boolean>;
type SectionErrors = Record<EmailHealthSectionKey, string | null>;

function emptySectionFlags<T>(value: T): Record<EmailHealthSectionKey, T> {
  return {
    domains: value,
    overview: value,
    spamRate: value,
    compliance: value,
    feedbackLoop: value,
    authentication: value,
    encryption: value,
    deliveryErrors: value,
    activeCampaign: value,
  };
}

interface EmailHealthState {
  filterId: string | null;
  domains: EmailHealthDomain[];
  selectedDomainId: number | null;
  range: EmailHealthRange;
  loading: SectionLoading;
  errors: SectionErrors;
  overview: EmailHealthOverview | null;
  spamRate: EmailHealthSpamRateResponse | null;
  compliance: EmailHealthComplianceResponse | null;
  feedbackLoop: EmailHealthFeedbackLoopResponse | null;
  authentication: EmailHealthSeriesResponse<AuthSeriesPoint> | null;
  encryption: EmailHealthSeriesResponse<TlsSeriesPoint> | null;
  deliveryErrors: EmailHealthSeriesResponse<DeliveryErrorDay> | null;
  activeCampaign: ActiveCampaignActivityResponse | null;
}

export const useEmailHealthStore = defineStore("emailHealth", {
  state: (): EmailHealthState => ({
    filterId: null,
    domains: [],
    selectedDomainId: null,
    range: "30d",
    loading: emptySectionFlags(false),
    errors: emptySectionFlags<string | null>(null),
    overview: null,
    spamRate: null,
    compliance: null,
    feedbackLoop: null,
    authentication: null,
    encryption: null,
    deliveryErrors: null,
    activeCampaign: null,
  }),
  getters: {
    selectedDomain(state): EmailHealthDomain | null {
      return state.domains.find((d) => d.id === state.selectedDomainId) ?? null;
    },
    query(state): EmailHealthQuery | null {
      if (!state.filterId) return null;
      return { filter_id: state.filterId, range: state.range };
    },
  },
  actions: {
    async loadDomains(filterId: string) {
      this.filterId = filterId;
      this.loading.domains = true;
      this.errors.domains = null;
      const activeCampaignPromise = this.loadActiveCampaignSeries();

      try {
        this.domains = await listDomains(filterId);

        const stillValid = this.domains.some((d) => d.id === this.selectedDomainId);
        if (!stillValid) {
          this.selectedDomainId = this.domains[0]?.id ?? null;
        }

        await Promise.allSettled([
          activeCampaignPromise,
          this.selectedDomainId ? this.refreshDomainSections() : Promise.resolve(this.clearDomainSectionData()),
        ]);
      } catch (error) {
        this.errors.domains = extractErrorMessage(error);
        this.clearDomainSectionData();
        await activeCampaignPromise;
      } finally {
        this.loading.domains = false;
      }
    },

    setRange(range: EmailHealthRange) {
      if (range === this.range) return;
      this.range = range;
      void this.refreshAll();
    },

    async refreshAll() {
      await Promise.allSettled([
        this.loadActiveCampaignSeries(),
        this.refreshDomainSections(),
      ]);
    },

    async loadActiveCampaignSeries() {
      const query = this.query;
      if (!query) return;
      await this.loadSection("activeCampaign", () => getActiveCampaignSeries(query));
    },

    async refreshDomainSections() {
      const domainId = this.selectedDomainId;
      const query = this.query;
      if (!domainId || !query) return;

      await Promise.allSettled([
        this.loadSection("overview", () => getOverview(domainId, query)),
        this.loadSection("spamRate", () => getSpamRate(domainId, query)),
        this.loadSection("compliance", () => getCompliance(domainId, query)),
        this.loadSection("feedbackLoop", () => getFeedbackLoop(domainId, query)),
        this.loadSection("authentication", () => getAuthentication(domainId, query)),
        this.loadSection("encryption", () => getEncryption(domainId, query)),
        this.loadSection("deliveryErrors", () => getDeliveryErrors(domainId, query)),
      ]);
    },

    async loadSection<K extends Exclude<EmailHealthSectionKey, "domains">>(
      section: K,
      fetcher: () => Promise<NonNullable<EmailHealthState[K]>>,
    ) {
      this.loading[section] = true;
      this.errors[section] = null;

      try {
        const result = await fetcher();
        (this as unknown as Record<string, unknown>)[section] = result;
      } catch (error) {
        this.errors[section] = extractErrorMessage(error);
      } finally {
        this.loading[section] = false;
      }
    },

    clearDomainSectionData() {
      this.overview = null;
      this.spamRate = null;
      this.compliance = null;
      this.feedbackLoop = null;
      this.authentication = null;
      this.encryption = null;
      this.deliveryErrors = null;
    },

    clearSectionData() {
      this.clearDomainSectionData();
      this.activeCampaign = null;
    },
  },
});

function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as { response?: { status?: number; data?: { message?: string } } }
    ).response;
    if (response?.status === 401 || response?.status === 403) return "forbidden";
    return response?.data?.message ?? "generic";
  }
  return "generic";
}
