<template>
  <div class="mx-auto w-full max-w-[840px] space-y-8 pb-10 pt-8">
    <ol class="flex items-start justify-center gap-16 border-b border-border pb-3">
      <li class="flex flex-col items-center gap-1 text-sm font-medium">
        <span class="flex size-9 items-center justify-center rounded-full bg-green-500 text-white"><Check class="size-5" /></span>
        Tipo de campanha
      </li>
      <li class="flex flex-col items-center gap-1 text-sm font-medium">
        <span :class="topStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'" class="flex size-9 items-center justify-center rounded-full">2</span>
        Configurar
      </li>
      <li class="flex flex-col items-center gap-1 text-sm font-medium" :class="topStep === 3 ? '' : 'text-muted-foreground'">
        <span :class="topStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'" class="flex size-9 items-center justify-center rounded-full">3</span>
        Finalizar
      </li>
    </ol>

    <template v-if="topStep === 2">
      <div class="flex items-center gap-2">
        <Lightbulb class="size-5 text-muted-foreground" />
        <h2 class="text-xl font-bold tracking-tight">Configurar campanha</h2>
      </div>

      <Tabs v-model="configurationTab">
        <TabsList class="flex w-full justify-start rounded-lg bg-muted p-1">
          <TabsTrigger value="channels" @click="changeTab('channels')">Canais</TabsTrigger>
          <TabsTrigger value="repetition" @click="changeTab('repetition')">Repetição</TabsTrigger>
          <TabsTrigger value="days" @click="changeTab('days')">Dias</TabsTrigger>
          <TabsTrigger value="segment" @click="changeTab('segment')">Segmento</TabsTrigger>
          <TabsTrigger value="schedule" @click="changeTab('schedule')">Agendar</TabsTrigger>
          <TabsTrigger value="spins" @click="changeTab('spins')">Giros</TabsTrigger>
          <TabsTrigger value="promotions" @click="changeTab('promotions')">Promoções</TabsTrigger>
        </TabsList>

        <Card class="mt-5 rounded-xl border shadow-sm">
          <CardContent class="pt-6">
            <template v-if="configurationTab === 'channels'">
              <CampaignChannelsStep
                v-model="model.messages"
                :project-id="projectId"
                :errors="sectionErrors('message')"
                :warnings="sectionWarnings('message')"
                :loading="stepLoading.message"
                :readonly="readonly"
                @change="emit('channels-change')"
              />
              <div class="mt-6 border-t pt-6">
                <CampaignLinksStep
                  v-model="model.links"
                  :detected-links="detectedLinks"
                  :errors="sectionErrors('links')"
                  :warnings="sectionWarnings('links')"
                  :loading="stepLoading.links"
                  :readonly="readonly"
                />
              </div>
            </template>

            <template v-else-if="configurationTab === 'repetition'">
              <CampaignRecurrenceStep
                v-model="model.recurrence_policy"
                :errors="sectionErrors('recurrence_policy')"
                :warnings="sectionWarnings('recurrence_policy')"
                :loading="stepLoading.recurrence_policy"
                :readonly="readonly"
                :is-applicable="model.schedule.schedule_type === 'recurring'"
              />
              <div class="mt-6 border-t pt-6">
                <CampaignWarmupStep
                  v-model="model.warmup_policy"
                  :errors="sectionErrors('warmup_policy')"
                  :warnings="sectionWarnings('warmup_policy')"
                  :loading="stepLoading.warmup_policy"
                  :readonly="readonly"
                />
              </div>
            </template>

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

            <div v-else class="rounded-lg border border-dashed p-8 text-center">
              <h3 class="font-semibold">{{ configurationTab === 'spins' ? 'Giros' : 'Promoções' }}</h3>
              <p class="mt-2 text-sm text-muted-foreground">
                Este recurso é específico do DeltaCRM e não está disponível nesta versão da campanha.
              </p>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      <div class="flex justify-end">
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
      <CampaignValidationList :errors="allErrors" :warnings="allWarnings" />
      <div class="grid gap-4 xl:grid-cols-2">
        <CampaignEstimatePanel
          :estimate="estimate"
          :loading="isEstimating"
          :disabled="!campaignId"
          :error-message="estimateErrorMessage"
          :on-refresh="onRefreshEstimate"
        />
        <CampaignChecklistPanel
          :validation="validation"
          :loading="isValidating"
          :disabled="!campaignId"
        />
      </div>
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="activeStep = 'schedule'">Voltar</Button>
        <Button variant="outline" :disabled="readonly || isSaving" @click="emit('save-continue', null)">
          {{ isSaving ? "Salvando..." : "Salvar" }}
        </Button>
        <Button :disabled="!campaignId || isValidating" @click="emit('validate')">
          {{ isValidating ? "Validando..." : "Validar configuração" }}
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Check, Lightbulb, Save } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignBasicStep from "./CampaignBasicStep.vue";
import CampaignChannelsStep from "./CampaignChannelsStep.vue";
import CampaignChecklistPanel from "./CampaignChecklistPanel.vue";
import CampaignDeliveryWindowsStep from "./CampaignDeliveryWindowsStep.vue";
import CampaignEstimatePanel from "./CampaignEstimatePanel.vue";
import CampaignLinksStep from "./CampaignLinksStep.vue";
import CampaignRecurrenceStep from "./CampaignRecurrenceStep.vue";
import CampaignScheduleStep from "./CampaignScheduleStep.vue";
import CampaignSingleStageStep from "./CampaignSingleStageStep.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import CampaignWarmupStep from "./CampaignWarmupStep.vue";
import type {
  CampaignEstimateResponse,
  CampaignFormState,
  CampaignValidationItem,
  CampaignValidationResponse,
} from "@/contracts/campaigns";

const props = defineProps<{
  projectId: number | null;
  detectedLinks: string[];
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
}>();

const model = defineModel<CampaignFormState>({ required: true });
const activeStep = defineModel<string>("activeStep", { required: true });
const stepLoading = computed(() => props.stepLoading);
const emit = defineEmits<{
  (event: "channels-change"): void;
  (event: "save-continue", next: string | null): void;
  (event: "validate"): void;
}>();

const localTab = ref<string | null>(null);
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

const topStep = computed(() => activeStep.value === "warmup_policy" ? 3 : 2);
const configurationTab = computed({
  get: () => {
    if (localTab.value === "spins" || localTab.value === "promotions") return localTab.value;
    if (activeStep.value === "audience") return "segment";
    if (activeStep.value === "schedule" || activeStep.value === "basic") return "schedule";
    if (activeStep.value === "delivery_windows") return "days";
    if (activeStep.value === "recurrence_policy") return "repetition";
    return "channels";
  },
  set: changeTab,
});

watch(activeStep, () => {
  if (activeStep.value !== "recurrence_policy") localTab.value = null;
});

function changeTab(value: unknown) {
  const tab = String(value);
  if (tab === "spins" || tab === "promotions") {
    localTab.value = tab;
    return;
  }
  localTab.value = null;
  const stepByTab: Record<string, string> = {
    channels: "message",
    repetition: "recurrence_policy",
    days: "delivery_windows",
    segment: "audience",
    schedule: "schedule",
  };
  if (stepByTab[tab]) activeStep.value = stepByTab[tab];
}

function saveContinue() {
  const nextByStep: Record<string, string | null> = {
    basic: "warmup_policy",
    audience: "schedule",
    message: "recurrence_policy",
    links: "recurrence_policy",
    schedule: "warmup_policy",
    delivery_windows: "audience",
    recurrence_policy: "delivery_windows",
    warmup_policy: null,
  };
  emit("save-continue", nextByStep[activeStep.value] ?? null);
}
</script>
