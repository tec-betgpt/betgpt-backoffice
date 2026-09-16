import { defineStore } from "pinia";
import {
  getAuthentication,
  getCompliance,
  getDeliveryErrors,
  getDomainReputation,
  getEncryption,
  getFeedbackLoop,
  getIpReputation,
  getOverview,
  getSpamRate,
  listDomains,
  type EmailHealthComplianceResponse,
  type EmailHealthFeedbackLoopResponse,
  type EmailHealthSeriesResponse,
  type EmailHealthSpamRateResponse,
} from "@/services/emailHealth";
import type {
  AuthSeriesPoint,
  DeliveryErrorDay,
  EmailHealthDomain,
  EmailHealthOverview,
  EmailHealthQuery,
  EmailHealthRange,
  IpReputationDay,
  MetricPoint,
  TlsSeriesPoint,
} from "@/contracts/emailHealth";

export type EmailHealthSectionKey =
  | "domains"
  | "overview"
  | "ipReputation"
  | "domainReputation"
  | "spamRate"
  | "compliance"
  | "feedbackLoop"
  | "authentication"
  | "encryption"
  | "deliveryErrors";

type SectionLoading = Record<EmailHealthSectionKey, boolean>;
type SectionErrors = Record<EmailHealthSectionKey, string | null>;

function emptySectionFlags<T>(value: T): Record<EmailHealthSectionKey, T> {
  return {
    domains: value,
    overview: value,
    ipReputation: value,
    domainReputation: value,
    spamRate: value,
    compliance: value,
    feedbackLoop: value,
    authentication: value,
    encryption: value,
    deliveryErrors: value,
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
  ipReputation: EmailHealthSeriesResponse<IpReputationDay> | null;
  domainReputation: EmailHealthSeriesResponse<MetricPoint<string>> | null;
  spamRate: EmailHealthSpamRateResponse | null;
  compliance: EmailHealthComplianceResponse | null;
  feedbackLoop: EmailHealthFeedbackLoopResponse | null;
  authentication: EmailHealthSeriesResponse<AuthSeriesPoint> | null;
  encryption: EmailHealthSeriesResponse<TlsSeriesPoint> | null;
  deliveryErrors: EmailHealthSeriesResponse<DeliveryErrorDay> | null;
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
    ipReputation: null,
    domainReputation: null,
    spamRate: null,
    compliance: null,
    feedbackLoop: null,
    authentication: null,
    encryption: null,
    deliveryErrors: null,
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

      try {
        this.domains = await listDomains(filterId);

        const stillValid = this.domains.some((d) => d.id === this.selectedDomainId);
        if (!stillValid) {
          this.selectedDomainId = this.domains[0]?.id ?? null;
        }

        if (this.selectedDomainId) {
          await this.refreshAll();
        } else {
          this.clearSectionData();
        }
      } catch (error) {
        this.errors.domains = extractErrorMessage(error);
        this.clearSectionData();
      } finally {
        this.loading.domains = false;
      }
    },

    selectDomain(id: number) {
      if (id === this.selectedDomainId) return;
      this.selectedDomainId = id;
      void this.refreshAll();
    },

    setRange(range: EmailHealthRange) {
      if (range === this.range) return;
      this.range = range;
      void this.refreshAll();
    },

    async refreshAll() {
      const domainId = this.selectedDomainId;
      const query = this.query;
      if (!domainId || !query) return;

      await Promise.allSettled([
        this.loadSection("overview", () => getOverview(domainId, query)),
        this.loadSection("ipReputation", () => getIpReputation(domainId, query)),
        this.loadSection("domainReputation", () => getDomainReputation(domainId, query)),
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

    clearSectionData() {
      this.overview = null;
      this.ipReputation = null;
      this.domainReputation = null;
      this.spamRate = null;
      this.compliance = null;
      this.feedbackLoop = null;
      this.authentication = null;
      this.encryption = null;
      this.deliveryErrors = null;
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
