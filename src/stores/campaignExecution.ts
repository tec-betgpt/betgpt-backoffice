import { defineStore } from "pinia";
import campaignExecutionService from "@/services/campaignExecution";
import type {
  CampaignPrepareResponse,
  CampaignRun,
  CampaignRunRecipient,
  CampaignRunRecipientsFilters,
  CampaignRunStatus,
  CampaignWave,
} from "@/contracts/campaignExecution";

export type CampaignExecutionAction =
  | "prepare"
  | "launch"
  | "pause"
  | "resume"
  | "cancel"
  | "refresh";

type CampaignExecutionLoading = Record<CampaignExecutionAction, boolean> & {
  recipients: boolean;
};

type CampaignExecutionErrors = Record<CampaignExecutionAction, string | null>;

const FINAL_RUN_STATUSES: CampaignRunStatus[] = ["completed", "canceled", "failed"];

const DEFAULT_FILTERS: CampaignRunRecipientsFilters = {
  status: null,
  dispatch_wave_id: null,
  broadcast_batch_id: null,
  player_id: null,
  phone: null,
  per_page: 50,
  page: 1,
};

function buildLoadingFlags(): CampaignExecutionLoading {
  return {
    prepare: false,
    launch: false,
    pause: false,
    resume: false,
    cancel: false,
    refresh: false,
    recipients: false,
  };
}

function buildErrors(): CampaignExecutionErrors {
  return {
    prepare: null,
    launch: null,
    pause: null,
    resume: null,
    cancel: null,
    refresh: null,
  };
}

export function extractExecutionErrorMessage(error: unknown, fallback: string): string {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (responseData && typeof responseData === "object") {
    const { errors, message } = responseData as {
      errors?: Record<string, string | string[]>;
      message?: string;
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

  return fallback;
}

export const useCampaignExecutionStore = defineStore("campaignExecution", {
  state: () => ({
    campaignId: null as number | null,
    run: null as CampaignRun | null,
    waves: [] as CampaignWave[],
    lastPrepareResult: null as CampaignPrepareResponse | null,
    recipients: [] as CampaignRunRecipient[],
    recipientsPagination: {
      current_page: 1,
      per_page: 50,
      total: 0,
      last_page: 1,
    },
    recipientFilters: { ...DEFAULT_FILTERS } as CampaignRunRecipientsFilters,
    loading: buildLoadingFlags(),
    errors: buildErrors(),
  }),

  getters: {
    hasRun: (state) => state.run !== null,
    runStatus: (state): CampaignRunStatus | null => state.run?.status ?? null,
    isRunFinal: (state) =>
      state.run ? FINAL_RUN_STATUSES.includes(state.run.status) : false,
    canPrepare: (state) => !state.loading.prepare,
    canLaunch: (state) =>
      !!state.run && ["prepared", "paused"].includes(state.run.status),
    canPause: (state) => !!state.run && state.run.status === "running",
    canResume: (state) => !!state.run && state.run.status === "paused",
    canCancel: (state) =>
      !!state.run && !FINAL_RUN_STATUSES.includes(state.run.status),
  },

  actions: {
    async prepare(campaignId: number) {
      this.loading.prepare = true;
      this.errors.prepare = null;

      try {
        const result = await campaignExecutionService.prepare(campaignId);
        this.lastPrepareResult = result;
        this.campaignId = campaignId;
        await this.fetchRun(campaignId);
        return result;
      } catch (error) {
        this.errors.prepare = extractExecutionErrorMessage(
          error,
          "Não foi possível preparar a campanha.",
        );
        throw error;
      } finally {
        this.loading.prepare = false;
      }
    },

    async launch(campaignId: number) {
      return this.runAction("launch", campaignId, "Não foi possível lançar a execução.");
    },

    async pause(campaignId: number) {
      return this.runAction("pause", campaignId, "Não foi possível pausar a execução.");
    },

    async resume(campaignId: number) {
      return this.runAction("resume", campaignId, "Não foi possível retomar a execução.");
    },

    async cancel(campaignId: number) {
      return this.runAction("cancel", campaignId, "Não foi possível cancelar a execução.");
    },

    async runAction(
      action: Exclude<CampaignExecutionAction, "prepare" | "refresh">,
      campaignId: number,
      fallbackMessage: string,
    ) {
      this.loading[action] = true;
      this.errors[action] = null;

      try {
        const result = await campaignExecutionService[action](campaignId);
        this.campaignId = campaignId;
        await this.fetchRun(campaignId);
        return result;
      } catch (error) {
        this.errors[action] = extractExecutionErrorMessage(error, fallbackMessage);
        throw error;
      } finally {
        this.loading[action] = false;
      }
    },

    async fetchRun(campaignId: number) {
      this.loading.refresh = true;
      this.errors.refresh = null;

      try {
        const { run, waves } = await campaignExecutionService.getRun(campaignId);
        this.campaignId = campaignId;
        this.run = run;
        this.waves = waves;
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status === 404) {
          // Campanha ainda não possui execução materializada.
          this.run = null;
          this.waves = [];
        } else {
          this.errors.refresh = extractExecutionErrorMessage(
            error,
            "Não foi possível carregar a execução da campanha.",
          );
          throw error;
        }
      } finally {
        this.loading.refresh = false;
      }
    },

    async fetchRunBatches(campaignId: number) {
      this.loading.refresh = true;
      this.errors.refresh = null;

      try {
        const { run, waves } = await campaignExecutionService.getRunBatches(campaignId);
        this.campaignId = campaignId;
        this.run = run;
        this.waves = waves;
      } catch (error) {
        this.errors.refresh = extractExecutionErrorMessage(
          error,
          "Não foi possível carregar os lotes da execução.",
        );
        throw error;
      } finally {
        this.loading.refresh = false;
      }
    },

    async fetchRunRecipients(
      campaignId: number,
      filters: CampaignRunRecipientsFilters = {},
    ) {
      this.loading.recipients = true;
      this.campaignId = campaignId;
      this.recipientFilters = { ...this.recipientFilters, ...filters };

      try {
        const response = await campaignExecutionService.getRunRecipients(
          campaignId,
          this.recipientFilters,
        );
        this.recipients = response.data;
        this.recipientsPagination = {
          current_page: response.current_page,
          per_page: response.per_page,
          total: response.total,
          last_page: response.last_page,
        };
      } finally {
        this.loading.recipients = false;
      }
    },

    async setRecipientFilters(campaignId: number, filters: CampaignRunRecipientsFilters) {
      await this.fetchRunRecipients(campaignId, { ...filters, page: 1 });
    },

    async setRecipientPage(campaignId: number, page: number) {
      await this.fetchRunRecipients(campaignId, { page });
    },

    reset() {
      this.campaignId = null;
      this.run = null;
      this.waves = [];
      this.lastPrepareResult = null;
      this.recipients = [];
      this.recipientsPagination = { current_page: 1, per_page: 50, total: 0, last_page: 1 };
      this.recipientFilters = { ...DEFAULT_FILTERS };
      this.loading = buildLoadingFlags();
      this.errors = buildErrors();
    },
  },
});
