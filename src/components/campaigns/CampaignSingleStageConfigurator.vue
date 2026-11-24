<template>
  <div class="mx-auto w-full max-w-[1180px] space-y-6 pb-10 pt-6">
    <ol class="flex items-start justify-center gap-16 border-b border-border pb-3">
      <li class="flex flex-col items-center gap-1 text-sm font-medium">
        <span class="flex size-9 items-center justify-center rounded-full bg-green-500 text-white"><Check class="size-5" /></span>
        Tipo de campanha
      </li>
      <li class="flex flex-col items-center gap-1 text-sm font-medium">
        <span class="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">2</span>
        Configurar
      </li>
      <li class="flex flex-col items-center gap-1 text-sm font-medium" :class="topStep === 3 ? '' : 'text-muted-foreground'">
        <span :class="topStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'" class="flex size-9 items-center justify-center rounded-full">3</span>
        Finalizar
      </li>
    </ol>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="min-w-0 space-y-5">
        <template v-if="topStep === 2">
          <div class="flex items-center gap-2">
            <Lightbulb class="size-5 text-muted-foreground" />
            <h2 class="text-xl font-bold tracking-tight">Configurar campanha</h2>
          </div>

          <Tabs v-model="configurationTab">
            <TabsList class="flex w-full justify-start overflow-x-auto rounded-lg bg-muted p-1">
              <TabsTrigger
                v-for="tab in configurationTabs"
                :key="tab.value"
                :value="tab.value"
                class="gap-1.5"
                @click="changeTab(tab.value)"
              >
                {{ tab.label }}
                <span
                  v-if="issueCount(tab.step)"
                  class="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-destructive align-middle text-[10px] font-semibold text-destructive-foreground"
                  :title="`${issueCount(tab.step)} pendência(s) nesta etapa`"
                >{{ issueCount(tab.step) }}</span>
              </TabsTrigger>
            </TabsList>

            <Card class="mt-4 rounded-xl border shadow-sm">
              <CardContent class="pt-6">
                <CampaignChannelsStep
                  v-if="configurationTab === 'channels'"
                  v-model="model.messages"
                  :project-id="projectId"
                  :errors="sectionErrors('message')"
                  :warnings="sectionWarnings('message')"
                  :loading="stepLoading.message"
                  :readonly="readonly"
                  @change="emit('channels-change')"
                />

                <CampaignRecurrenceStep
                  v-else-if="configurationTab === 'repetition'"
                  v-model="model.recurrence_policy"
                  :errors="sectionErrors('recurrence_policy')"
                  :warnings="sectionWarnings('recurrence_policy')"
                  :loading="stepLoading.recurrence_policy"
                  :readonly="readonly"
                />

                <CampaignDeliveryWindowsStep
                  v-else-if="configurationTab === 'days'"
                  v-model="model.delivery_windows"
                  :errors="sectionErrors('delivery_windows')"
                  :warnings="sectionWarnings('delivery_windows')"
                  :loading="stepLoading.delivery_windows"
                  :readonly="readonly"
                />

                <CampaignSingleStageStep
                  v-else-if="configurationTab === 'segment'"
                  v-model="model.single_stage_config"
                  :errors="sectionErrors('audience')"
                  :warnings="sectionWarnings('audience')"
                  :loading="stepLoading.audience"
                  :readonly="readonly"
                  :channel="model.channel"
                />

                <template v-else-if="configurationTab === 'schedule'">
                  <CampaignBasicStep
                    v-model="model"
                    :errors="sectionErrors('basic')"
                    :warnings="sectionWarnings('basic')"
                    :loading="stepLoading.basic"
                    :readonly="readonly"
                  />
                  <div class="mt-6 border-t pt-6">
                    <CampaignScheduleStep
                      v-model="model.schedule"
                      :errors="sectionErrors('schedule')"
                      :warnings="sectionWarnings('schedule')"
                      :loading="stepLoading.schedule"
                      :readonly="readonly"
                    />
                  </div>
                </template>

                <CampaignWarmupStep
                  v-else-if="configurationTab === 'warmup'"
                  v-model="model.warmup_policy"
                  :errors="sectionErrors('warmup_policy')"
                  :warnings="sectionWarnings('warmup_policy')"
                  :loading="stepLoading.warmup_policy"
                  :readonly="readonly"
                />
              </CardContent>
            </Card>
          </Tabs>

          <Alert v-if="stepError" variant="destructive" data-test="step-error">
            <CircleAlert class="size-4" />
            <AlertTitle>Não foi possível avançar em “{{ currentTabLabel }}”</AlertTitle>
            <AlertDescription>{{ stepError }}</AlertDescription>
          </Alert>

          <div class="flex items-center justify-between gap-2">
            <Button v-if="previousStep" variant="outline" :disabled="isSaving" @click="activeStep = previousStep">
              <ArrowLeft class="mr-2 size-4" />
              Voltar
            </Button>
            <span v-else />
            <Button :disabled="readonly || isSaving" @click="saveContinue">
              <Save class="mr-2 size-4" />
              {{ isSaving ? "Salvando..." : "Salvar e continuar" }}
            </Button>
          </div>
        </template>

        <template v-else>
          <div class="flex items-center gap-2">
            <Lightbulb class="size-5 text-muted-foreground" />
            <h2 class="text-xl font-bold tracking-tight">Finalizar campanha</h2>
          </div>
          <p class="text-sm text-muted-foreground">
            Revise o resumo e resolva os itens pendentes antes de validar a configuração.
          </p>
          <CampaignValidationList :errors="allErrors" :warnings="allWarnings" />
          <CampaignChecklistPanel
            :validation="validation"
            :loading="isValidating"
            :disabled="!campaignId"
          />
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="activeStep = 'warmup_policy'">Voltar</Button>
            <Button variant="outline" :disabled="readonly || isSaving" @click="emit('save-continue', null)">
              {{ isSaving ? "Salvando..." : "Salvar" }}
            </Button>
            <Button :disabled="!campaignId || isValidating" @click="emit('validate')">
              {{ isValidating ? "Validando..." : "Validar configuração" }}
            </Button>
          </div>
        </template>
      </div>

      <CampaignWizardSidebar
        :form="model"
        :estimate="estimate"
        :loading="isEstimating"
        :error-message="estimateErrorMessage"
        :campaign-id="campaignId"
        :segments="segments"
        @refresh="onRefreshEstimate()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { ArrowLeft, Check, CircleAlert, Lightbulb, Save } from "lucide-vue-next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignBasicStep from "./CampaignBasicStep.vue";
import CampaignChannelsStep from "./CampaignChannelsStep.vue";
import CampaignChecklistPanel from "./CampaignChecklistPanel.vue";
import CampaignDeliveryWindowsStep from "./CampaignDeliveryWindowsStep.vue";
import CampaignRecurrenceStep from "./CampaignRecurrenceStep.vue";
import CampaignScheduleStep from "./CampaignScheduleStep.vue";
import CampaignSingleStageStep from "./CampaignSingleStageStep.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import CampaignWarmupStep from "./CampaignWarmupStep.vue";
import CampaignWizardSidebar from "./CampaignWizardSidebar.vue";
import { deriveCampaignScheduleType } from "@/services/campaignPayload";
import type {
  CampaignEstimateResponse,
  CampaignFormState,
  CampaignTargetAudienceSummary,
  CampaignValidationItem,
  CampaignValidationResponse,
} from "@/contracts/campaigns";

const props = defineProps<{
  projectId: number | null;
  stepLoading: Record<string, boolean>;
  readonly?: boolean;
  isSaving?: boolean;
  sectionErrors: (step: string) => CampaignValidationItem[];
  sectionWarnings: (step: string) => CampaignValidationItem[];
  allErrors: CampaignValidationItem[];
  allWarnings: CampaignValidationItem[];
  estimate: CampaignEstimateResponse | null;
  isEstimating?: boolean;
  estimateErrorMessage?: string;
  campaignId: number | null;
  onRefreshEstimate: () => void;
  validation: CampaignValidationResponse | null;
  isValidating?: boolean;
  stepError?: string;
  stepIssueCount?: (step: string) => number;
  segments?: CampaignTargetAudienceSummary[];
}>();

const model = defineModel<CampaignFormState>({ required: true });
const activeStep = defineModel<string>("activeStep", { required: true });
const stepLoading = computed(() => props.stepLoading);
const emit = defineEmits<{
  (event: "channels-change"): void;
  (event: "save-continue", next: string | null): void;
  (event: "validate"): void;
}>();

const readonly = computed(() => Boolean(props.readonly));
const isSaving = computed(() => Boolean(props.isSaving));
const isEstimating = computed(() => Boolean(props.isEstimating));
const isValidating = computed(() => Boolean(props.isValidating));
const sectionErrors = computed(() => props.sectionErrors);
const sectionWarnings = computed(() => props.sectionWarnings);
const allErrors = computed(() => props.allErrors);
const allWarnings = computed(() => props.allWarnings);
const campaignId = computed(() => props.campaignId);
const estimate = computed(() => props.estimate);
const estimateErrorMessage = computed(() => props.estimateErrorMessage);
const validation = computed(() => props.validation);
const onRefreshEstimate = computed(() => props.onRefreshEstimate);

const segments = computed(() => props.segments ?? []);
const stepError = computed(() => props.stepError ?? "");
const configurationTabs = [
  { value: "channels", label: "Canais", step: "message" },
  { value: "repetition", label: "Repetição", step: "recurrence_policy" },
  { value: "days", label: "Dias", step: "delivery_windows" },
  { value: "segment", label: "Segmento", step: "audience" },
  { value: "schedule", label: "Agendar", step: "schedule" },
  { value: "warmup", label: "Warmup", step: "warmup_policy" },
];
const currentTabLabel = computed(() => configurationTabs.find((tab) => tab.value === configurationTab.value)?.label ?? "");
const previousStep = computed(() => {
  const index = configurationTabs.findIndex((tab) => tab.value === configurationTab.value);
  return index > 0 ? configurationTabs[index - 1].step : null;
});

function issueCount(step: string) {
  return props.stepIssueCount?.(step) ?? 0;
}

const topStep = computed(() => activeStep.value === "review" ? 3 : 2);
const configurationTab = computed({
  get: () => {
    if (activeStep.value === "audience") return "segment";
    if (activeStep.value === "schedule" || activeStep.value === "basic") return "schedule";
    if (activeStep.value === "delivery_windows") return "days";
    if (activeStep.value === "recurrence_policy") return "repetition";
    if (activeStep.value === "warmup_policy") return "warmup";
    return "channels";
  },
  set: changeTab,
});

watch(
  () => model.value.recurrence_policy.is_enabled,
  () => {
    model.value.schedule.schedule_type = deriveCampaignScheduleType(
      model.value.schedule,
      model.value.recurrence_policy,
    );
  },
  { immediate: true },
);

function changeTab(value: unknown) {
  const stepByTab: Record<string, string> = {
    channels: "message",
    repetition: "recurrence_policy",
    days: "delivery_windows",
    segment: "audience",
    schedule: "schedule",
    warmup: "warmup_policy",
  };
  const step = stepByTab[String(value)];
  if (step) activeStep.value = step;
}

function saveContinue() {
  const nextByStep: Record<string, string | null> = {
    basic: "schedule",
    audience: "schedule",
    message: "recurrence_policy",
    links: "recurrence_policy",
    schedule: "warmup_policy",
    delivery_windows: "audience",
    recurrence_policy: "delivery_windows",
    warmup_policy: "review",
  };
  emit("save-continue", nextByStep[activeStep.value] ?? null);
}
</script>
