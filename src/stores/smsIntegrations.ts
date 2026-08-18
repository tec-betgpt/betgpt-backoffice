import { defineStore } from "pinia";
import elevateSmsIntegrationService from "@/services/elevateSmsIntegration";
import type { ElevateSmsIntegrationConfig } from "@/contracts/elevateSmsIntegration";
import {
  ELEVATE_SMS_PROVIDER_SLUG,
  ELEVATE_SMS_SUPPLIER_SLUG,
} from "@/contracts/elevateSmsIntegration";

export type ElevateSmsFormState = {
  api_key: string;
  email: string;
  is_active: boolean;
  sender: string;
  status_callback_url: string;
  metadata: Record<string, unknown>;
};

export type ElevateSmsFieldErrors = Partial<Record<keyof ElevateSmsFormState, string>>;

function emptyForm(): ElevateSmsFormState {
  return {
    api_key: "",
    email: "",
    is_active: true,
    sender: "",
    status_callback_url: "",
    metadata: {},
  };
}

function formFromConfig(config: ElevateSmsIntegrationConfig): ElevateSmsFormState {
  return {
    api_key: config.api_key ?? "",
    email: config.email ?? "",
    is_active: Boolean(config.is_active),
    sender: config.sender ?? "",
    status_callback_url: config.status_callback_url ?? "",
    metadata:
      config.metadata && typeof config.metadata === "object" && !Array.isArray(config.metadata)
        ? { ...config.metadata }
        : {},
  };
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (responseData && typeof responseData === "object") {
    const { message } = responseData as { message?: string };
    if (message) {
      return message;
    }
  }

  return fallback;
}

/** Extrai o primeiro erro por campo no formato Laravel (`errors: { campo: [msgs] }`). */
function extractFieldErrors(error: unknown): ElevateSmsFieldErrors {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (!responseData || typeof responseData !== "object") {
    return {};
  }

  const { errors } = responseData as { errors?: Record<string, string | string[]> };
  if (!errors || typeof errors !== "object") {
    return {};
  }

  const fieldErrors: ElevateSmsFieldErrors = {};
  Object.entries(errors).forEach(([field, messages]) => {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (first && field in emptyForm()) {
      fieldErrors[field as keyof ElevateSmsFormState] = first;
    }
  });

  return fieldErrors;
}

export const useSmsIntegrationsStore = defineStore("smsIntegrations", {
  state: () => ({
    projectId: null as number | string | null,
    configured: false,
    form: emptyForm() as ElevateSmsFormState,
    loading: false,
    saving: false,
    saved: false,
    loadFailed: false,
    error: null as string | null,
    fieldErrors: {} as ElevateSmsFieldErrors,
  }),

  getters: {
    statusBadge(state): "active" | "inactive" | "not_configured" {
      if (!state.configured) {
        return "not_configured";
      }
      return state.form.is_active ? "active" : "inactive";
    },
  },

  actions: {
    async fetchConfig(projectId: number | string) {
      this.projectId = projectId;
      this.loading = true;
      this.error = null;
      this.saved = false;
      this.loadFailed = false;

      try {
        const config = await elevateSmsIntegrationService.getElevateSmsConfig(projectId);
        this.configured = true;
        this.form = formFromConfig(config);
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status === 404) {
          // Integração ainda não configurada (ou sem permissão): formulário em estado inicial.
          this.configured = false;
          this.form = emptyForm();
        } else {
          this.loadFailed = true;
          this.error = extractErrorMessage(
            error,
            "Não foi possível carregar a configuração da integração de SMS.",
          );
          throw error;
        }
      } finally {
        this.loading = false;
      }
    },

    async saveConfig() {
      if (!this.projectId) {
        return;
      }

      this.saving = true;
      this.saved = false;
      this.error = null;
      this.fieldErrors = {};

      try {
        const config = await elevateSmsIntegrationService.saveElevateSmsConfig(this.projectId, {
          provider_slug: ELEVATE_SMS_PROVIDER_SLUG,
          supplier_slug: ELEVATE_SMS_SUPPLIER_SLUG,
          api_key: this.form.api_key,
          email: this.form.email,
          is_active: this.form.is_active,
          sender: this.form.sender.trim() || null,
          status_callback_url: this.form.status_callback_url.trim() || null,
          metadata: this.form.metadata,
        });

        this.configured = true;
        this.form = formFromConfig(config);
        this.saved = true;
        return config;
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status === 422) {
          this.fieldErrors = extractFieldErrors(error);
        }

        this.error = extractErrorMessage(
          error,
          "Não foi possível salvar a configuração da integração de SMS.",
        );
        throw error;
      } finally {
        this.saving = false;
      }
    },

    reset() {
      this.projectId = null;
      this.configured = false;
      this.form = emptyForm();
      this.loading = false;
      this.saving = false;
      this.saved = false;
      this.loadFailed = false;
      this.error = null;
      this.fieldErrors = {};
    },
  },
});
