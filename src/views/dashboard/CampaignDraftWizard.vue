<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-2xl font-bold tracking-tight">{{ campaignId ? "Editar campanha draft" : "Nova campanha draft" }}</h2>
          <Badge v-if="campaign" variant="outline">{{ statusLabel }}</Badge>
          <Badge v-if="isDirty" variant="secondary">Alterações locais</Badge>
          <Badge v-else-if="campaign" variant="outline">Salvo</Badge>
        </div>
        <p class="text-muted-foreground">
          Crie, edite e valide a configuração do rascunho de campanha SMS.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" :disabled="isReadonly || isSaving" @click="saveDraft(activeStep)">
          {{ isSaving ? "Salvando..." : "Salvar rascunho" }}
        </Button>
        <Button :disabled="!campaign?.id || isValidating" @click="runValidation">
          {{ isValidating ? "Validando..." : "Validar configuração" }}
        </Button>
      </div>
    </div>

    <Alert v-if="isReadonly">
      <AlertTitle>Edição bloqueada</AlertTitle>
      <AlertDescription>Esta campanha não está mais em rascunho. Os dados abaixo estão somente para consulta.</AlertDescription>
    </Alert>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card>
        <CardContent class="space-y-2 pt-6">
          <button
            v-for="(step, index) in steps"
            :key="step.key"
            type="button"
            class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            :class="activeStep === step.key ? 'bg-accent font-medium' : ''"
            @click="activeStep = step.key"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs">{{ index + 1 }}</span>
              <span class="truncate">{{ step.label }}</span>
            </span>
            <span class="flex shrink-0 items-center gap-1">
              <Badge v-if="sectionErrors(step.key).length" variant="destructive">Erro</Badge>
              <Badge v-else-if="sectionWarnings(step.key).length" variant="outline">Aviso</Badge>
            </span>
          </button>
          <Progress :model-value="progressValue" class="mt-4" />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <CampaignBasicStep
            v-if="activeStep === 'basic'"
            v-model="formModel"
            :errors="sectionErrors('basic')"
            :warnings="sectionWarnings('basic')"
            :loading="stepLoading.basic"
            :readonly="isReadonly"
            :on-save="() => saveDraft('basic')"
          />
          <CampaignSingleStageStep
            v-if="activeStep === 'audience'"
            v-model="form.single_stage_config"
            :errors="sectionErrors('audience')"
            :warnings="sectionWarnings('audience')"
            :loading="stepLoading.audience"
            :readonly="isReadonly"
            :on-save="() => saveDraft('audience')"
          />
          <CampaignMessageStep
            v-if="activeStep === 'message'"
            v-model="form.message"
            :errors="sectionErrors('message')"
            :warnings="sectionWarnings('message')"
            :loading="stepLoading.message"
            :readonly="isReadonly"
            :on-save="() => saveDraft('message')"
          />
          <CampaignLinksStep
            v-if="activeStep === 'links'"
            v-model="form.links"
            :detected-links="form.message.detected_links || []"
            :errors="sectionErrors('links')"
            :warnings="sectionWarnings('links')"
            :loading="stepLoading.links"
            :readonly="isReadonly"
            :on-save="() => saveDraft('links')"
          />
          <CampaignScheduleStep
            v-if="activeStep === 'schedule'"
            v-model="form.schedule"
            :errors="sectionErrors('schedule')"
            :warnings="sectionWarnings('schedule')"
            :loading="stepLoading.schedule"
            :readonly="isReadonly"
            :on-save="() => saveDraft('schedule')"
          />
          <CampaignDeliveryWindowsStep
            v-if="activeStep === 'delivery_windows'"
            v-model="form.delivery_windows"
            :errors="sectionErrors('delivery_windows')"
            :warnings="sectionWarnings('delivery_windows')"
            :loading="stepLoading.delivery_windows"
            :readonly="isReadonly"
            :on-save="() => saveDraft('delivery_windows')"
          />
          <CampaignRecurrenceStep
            v-if="activeStep === 'recurrence_policy'"
            v-model="form.recurrence_policy"
            :errors="sectionErrors('recurrence_policy')"
            :warnings="sectionWarnings('recurrence_policy')"
            :loading="stepLoading.recurrence_policy"
            :readonly="isReadonly"
            :on-save="() => saveDraft('recurrence_policy')"
          />
          <CampaignWarmupStep
            v-if="activeStep === 'warmup_policy'"
            v-model="form.warmup_policy"
            :errors="sectionErrors('warmup_policy')"
            :warnings="sectionWarnings('warmup_policy')"
            :loading="stepLoading.warmup_policy"
            :readonly="isReadonly"
            :on-save="() => saveDraft('warmup_policy')"
          />
        </CardContent>
      </Card>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <Button variant="outline" :disabled="activeStepIndex === 0" @click="goToStep(activeStepIndex - 1)">Voltar</Button>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="isReadonly || isSaving" @click="saveDraft(activeStep)">
          {{ isSaving ? "Salvando..." : "Salvar" }}
        </Button>
        <Button :disabled="activeStepIndex === steps.length - 1" @click="goToStep(activeStepIndex + 1)">Avançar</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import CampaignBasicStep from "@/components/campaigns/CampaignBasicStep.vue";
import CampaignDeliveryWindowsStep from "@/components/campaigns/CampaignDeliveryWindowsStep.vue";
import CampaignLinksStep from "@/components/campaigns/CampaignLinksStep.vue";
import CampaignMessageStep from "@/components/campaigns/CampaignMessageStep.vue";
import CampaignRecurrenceStep from "@/components/campaigns/CampaignRecurrenceStep.vue";
import CampaignScheduleStep from "@/components/campaigns/CampaignScheduleStep.vue";
import CampaignSingleStageStep from "@/components/campaigns/CampaignSingleStageStep.vue";
import CampaignWarmupStep from "@/components/campaigns/CampaignWarmupStep.vue";
import { createCampaign, getCampaign, updateCampaign, validateCampaign } from "@/services/campaigns";
import type {
  CampaignDetail,
  CampaignFormState,
  CampaignStatus,
  CampaignStorePayload,
  CampaignUpdatePayload,
  CampaignValidationItem,
  CampaignValidationSection,
  CampaignValidationSections,
} from "@/contracts/campaigns";
import { CAMPAIGN_STATUS_LABELS } from "@/contracts/campaigns";

type StepKey =
  | "basic"
  | "audience"
  | "message"
  | "links"
  | "schedule"
  | "delivery_windows"
  | "recurrence_policy"
  | "warmup_policy";

type HttpLikeError = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string | string[]>;
    };
  };
};

const steps: { key: StepKey; label: string; section: CampaignValidationSection }[] = [
  { key: "basic", label: "Dados básicos", section: "campaign" },
  { key: "audience", label: "Público", section: "campaign" },
  { key: "message", label: "Mensagem SMS", section: "message" },
  { key: "links", label: "Links", section: "links" },
  { key: "schedule", label: "Agendamento", section: "schedule" },
  { key: "delivery_windows", label: "Janelas", section: "delivery_windows" },
  { key: "recurrence_policy", label: "Recorrência", section: "recurrence_policy" },
  { key: "warmup_policy", label: "Warmup", section: "warmup_policy" },
];

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const campaign = ref<CampaignDetail | null>(null);
const activeStep = ref<StepKey>("basic");
const isDirty = ref(false);
const isSaving = ref(false);
const isValidating = ref(false);
const errorMessage = ref("");
const suppressDirty = ref(false);
const validationErrors = ref<CampaignValidationSections>({});
const validationWarnings = ref<CampaignValidationSections>({});

const stepLoading = reactive<Record<StepKey, boolean>>({
  basic: false,
  audience: false,
  message: false,
  links: false,
  schedule: false,
  delivery_windows: false,
  recurrence_policy: false,
  warmup_policy: false,
});

const form = reactive<CampaignFormState>(createEmptyForm());
const formModel = computed({
  get: () => form,
  set: (value: CampaignFormState) => {
    Object.assign(form, value);
  },
});

const campaignId = computed(() => {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const activeStepIndex = computed(() => steps.findIndex((step) => step.key === activeStep.value));
const progressValue = computed(() => ((activeStepIndex.value + 1) / steps.length) * 100);
const isReadonly = computed(() => Boolean(campaign.value && campaign.value.status !== "draft"));
const statusLabel = computed(() => CAMPAIGN_STATUS_LABELS[(campaign.value?.status || "draft") as CampaignStatus]);

watch(
  form,
  () => {
    if (!suppressDirty.value) {
      isDirty.value = true;
    }
  },
  { deep: true },
);

onMounted(async () => {
  if (campaignId.value) {
    await loadCampaign(campaignId.value);
  }
});

function createEmptyForm(): CampaignFormState {
  return {
    name: "",
    description: null,
    type: "broadcast",
    channel: "sms",
    metadata: null,
    single_stage_config: {
      target_audience_id: null,
      audience_mode: "none",
      apply_protection_list: true,
      apply_opt_out: true,
      apply_suppression: true,
      daily_recipient_cap: null,
      total_recipient_cap: null,
      eligibility_rules: null,
      metadata: null,
    },
    message: {
      channel: "sms",
      locale: "",
      body: "",
      character_count: 0,
      sms_segments_count: 0,
      detected_links: [],
      variables: [],
      metadata: null,
    },
    links: [],
    schedule: {
      schedule_type: "scheduled",
      timezone: "America/Sao_Paulo",
      starts_at: null,
      ends_at: null,
      respect_delivery_windows: true,
      metadata: null,
    },
    delivery_windows: [
      { day_of_week: 1, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 2, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 3, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 4, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 5, starts_at: "10:00", ends_at: "18:00", is_active: true },
    ],
    recurrence_policy: {
      is_enabled: false,
      frequency: "weekly",
      interval: 1,
      days_of_week: [],
      days_of_month: [],
      repeat_until: null,
      max_occurrences: null,
      metadata: null,
    },
    warmup_policy: {
      is_enabled: false,
      initial_limit: null,
      increment_amount: null,
      increment_type: "fixed",
      interval_unit: "day",
      interval_value: 1,
      max_limit: null,
      metadata: null,
    },
  };
}

async function loadCampaign(id: number) {
  errorMessage.value = "";
  try {
    const detail = await getCampaign(id);
    campaign.value = detail;
    applyCampaignDetail(detail);
    isDirty.value = false;
  } catch (error) {
    handleHttpError(error);
  }
}

function applyCampaignDetail(detail: CampaignDetail) {
  suppressDirty.value = true;
  Object.assign(form, createEmptyForm(), {
    name: detail.name,
    description: detail.description,
    type: detail.type,
    channel: detail.channel,
    metadata: detail.metadata,
    single_stage_config: {
      ...createEmptyForm().single_stage_config,
      ...(detail.single_stage_config || {}),
    },
    message: {
      ...createEmptyForm().message,
      ...((detail.messages && detail.messages[0]) || {}),
    },
    links: detail.links || [],
    schedule: {
      ...createEmptyForm().schedule,
      ...(detail.schedule || {}),
      starts_at: toDateTimeLocal(detail.schedule?.starts_at || null),
      ends_at: toDateTimeLocal(detail.schedule?.ends_at || null),
    },
    delivery_windows: detail.delivery_windows?.length ? detail.delivery_windows : createEmptyForm().delivery_windows,
    recurrence_policy: {
      ...createEmptyForm().recurrence_policy,
      ...(detail.recurrence_policy || {}),
      repeat_until: detail.recurrence_policy?.repeat_until?.slice(0, 10) || null,
    },
    warmup_policy: {
      ...createEmptyForm().warmup_policy,
      ...(detail.warmup_policy || {}),
    },
  });
  window.setTimeout(() => {
    suppressDirty.value = false;
  }, 0);
}

async function saveDraft(step: StepKey) {
  if (isReadonly.value) return;

  errorMessage.value = "";
  clearCurrentHttpErrors(step);
  stepLoading[step] = true;
  isSaving.value = true;

  try {
    if (!campaign.value?.id) {
      const payload = buildStorePayload();
      const detail = await createCampaign(payload);
      campaign.value = detail;
      applyCampaignDetail(detail);
      await router.replace({ name: "campaign-drafts.edit", params: { id: detail.id } });
      toast({ title: "Campanha criada como rascunho." });
    } else {
      await updateCampaign(campaign.value.id, buildUpdatePayload());
      isDirty.value = false;
      toast({ title: "Rascunho salvo." });
    }
  } catch (error) {
    handleHttpError(error, step);
  } finally {
    stepLoading[step] = false;
    isSaving.value = false;
  }
}

async function runValidation() {
  if (!campaign.value?.id) return;

  errorMessage.value = "";
  isValidating.value = true;
  try {
    const result = await validateCampaign(campaign.value.id);
    validationErrors.value = result.errors || {};
    validationWarnings.value = result.warnings || {};
    if (!result.valid) {
      const firstErrorStep = steps.find((step) => sectionErrors(step.key).length > 0);
      if (firstErrorStep) activeStep.value = firstErrorStep.key;
    }
    toast({ title: result.valid ? "Configuração válida." : "Configuração inválida." });
  } catch (error) {
    handleHttpError(error);
  } finally {
    isValidating.value = false;
  }
}

function buildStorePayload(): CampaignStorePayload {
  const projectId = getActiveProjectId();

  if (!projectId || !form.name.trim()) {
    throw new Error("Informe um projeto ativo e o nome para criar o rascunho.");
  }

  return {
    project_id: projectId,
    name: form.name,
    description: form.description,
    type: "broadcast",
    channel: "sms",
    metadata: form.metadata,
    single_stage_config: form.single_stage_config,
    message: form.message,
    links: form.links,
    schedule: form.schedule,
    delivery_windows: form.delivery_windows,
    recurrence_policy: form.recurrence_policy,
    warmup_policy: form.warmup_policy,
  };
}

function buildUpdatePayload(): CampaignUpdatePayload {
  return {
    name: form.name,
    description: form.description,
    type: "broadcast",
    channel: "sms",
    metadata: form.metadata,
    single_stage_config: form.single_stage_config,
    message: form.message,
    links: form.links,
    schedule: form.schedule,
    delivery_windows: form.delivery_windows,
    recurrence_policy: form.recurrence_policy,
    warmup_policy: form.warmup_policy,
  };
}

function sectionForStep(stepKey: StepKey): CampaignValidationSection {
  return steps.find((step) => step.key === stepKey)?.section || "campaign";
}

function sectionErrors(stepKey: StepKey): CampaignValidationItem[] {
  return validationErrors.value[sectionForStep(stepKey)] || [];
}

function sectionWarnings(stepKey: StepKey): CampaignValidationItem[] {
  return validationWarnings.value[sectionForStep(stepKey)] || [];
}

function clearCurrentHttpErrors(stepKey: StepKey) {
  const section = sectionForStep(stepKey);
  validationErrors.value = { ...validationErrors.value, [section]: [] };
}

function goToStep(index: number) {
  const step = steps[index];
  if (step) activeStep.value = step.key;
}

function toDateTimeLocal(value: string | null) {
  return value ? value.slice(0, 16) : null;
}

function getActiveProjectId() {
  const numeric = Number(workspaceStore.activeGroupProject?.project_id);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function handleHttpError(error: unknown, step?: StepKey) {
  if (!isHttpLikeError(error)) {
    errorMessage.value = "Erro inesperado.";
    return;
  }

  const status = error.response?.status;

  if (!error.response && error.message) {
    errorMessage.value = error.message;
    return;
  }

  if (status === 403) {
    errorMessage.value = "Você não tem permissão para executar esta ação.";
    return;
  }

  if (status === 422) {
    const errors = error.response?.data?.errors || {};
    const items = Object.entries(errors).flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages.map((message) => ({ field, message: String(message) }))
        : [{ field, message: String(messages) }],
    );
    const section = step ? sectionForStep(step) : "campaign";
    validationErrors.value = { ...validationErrors.value, [section]: items };
    errorMessage.value = "Revise os campos destacados antes de continuar.";
    return;
  }

  errorMessage.value = error.response?.data?.message || "Erro inesperado ao comunicar com o servidor.";
}

function isHttpLikeError(error: unknown): error is HttpLikeError {
  return typeof error === "object" && error !== null && ("response" in error || "message" in error);
}
</script>
