<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Configuração de público</h3>
      <p class="text-sm text-muted-foreground">
        Selecione um ou mais segmentos e acompanhe a população elegível de cada um e o total único da campanha.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="space-y-4">
      <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <div class="space-y-2">
          <Label>Segmentos</Label>
          <select v-model="segmentToAdd" :disabled="readonly || isLoadingAudiences" class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{{ isLoadingAudiences ? 'Carregando segmentos...' : 'Selecione um segmento' }}</option>
            <option v-for="audience in availableAudiences" :key="audience.id" :value="String(audience.id)">
              {{ audience.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <Button type="button" variant="outline" :disabled="readonly || !segmentToAdd" @click="addSegment">+ Adicionar segmento</Button>
        </div>
      </div>

      <div v-if="selectedIds.length === 0" class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum segmento selecionado. Adicione ao menos um segmento para continuar.
      </div>

      <div v-for="segment in selectedSegments" :key="segment.id" class="rounded-lg border p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="font-medium">{{ segment.name }}</div>
            <div class="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{{ eligibleFor(segment.id) }} elegíveis</Badge>
              <span v-if="segment.players !== undefined">Base: {{ segment.players }}</span>
            </div>
            <p v-if="previewErrorFor(segment.id)" class="mt-2 text-xs text-destructive">{{ previewErrorFor(segment.id) }}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" :disabled="readonly" @click="removeSegment(segment.id)">Remover</Button>
        </div>
      </div>

      <div v-if="selectedIds.length" class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-4">
        <span class="text-sm font-medium">Total elegível único da campanha</span>
        <Badge variant="default">{{ preview?.total_eligible ?? 0 }}</Badge>
      </div>
      <p v-if="isPreviewing" class="text-xs text-muted-foreground">Calculando população elegível...</p>
      <Alert v-if="previewError"><AlertDescription>{{ previewError }}</AlertDescription></Alert>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="space-y-2">
        <Label>Modo da audiência</Label>
        <select v-model="model.audience_mode" :disabled="readonly" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="none">Nenhuma</option>
          <option value="fixed">Fixa</option>
          <option value="dynamic">Dinâmica</option>
        </select>
      </div>
      <div class="space-y-2">
        <Label>Limite diário</Label>
        <Input
          :model-value="model.daily_recipient_cap ?? undefined"
          type="number"
          min="0"
          :disabled="readonly"
          @update:model-value="updateCap('daily_recipient_cap', $event)"
        />
      </div>
      <div class="space-y-2">
        <Label>Limite total</Label>
        <Input
          :model-value="model.total_recipient_cap ?? undefined"
          type="number"
          min="0"
          :disabled="readonly"
          @update:model-value="updateCap('total_recipient_cap', $event)"
        />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
        <Switch v-model:checked="model.apply_protection_list" :disabled="readonly" />
        Lista de proteção
      </label>
      <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
        <Switch v-model:checked="model.apply_opt_out" :disabled="readonly" />
        Opt-out
      </label>
      <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
        <Switch v-model:checked="model.apply_suppression" :disabled="readonly" />
        Suppression
      </label>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <CampaignJsonField v-model="model.eligibility_rules" label="Regras de elegibilidade" :readonly="readonly" />
      <CampaignJsonField v-model="model.metadata" label="Metadata" :readonly="readonly" />
    </div>

    <Button v-if="onSave" variant="outline" :disabled="readonly || loading" @click="onSave">
      {{ loading ? "Salvando..." : "Salvar etapa" }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import CampaignJsonField from "./CampaignJsonField.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type {
  CampaignAudiencePreviewResponse,
  CampaignChannel,
  CampaignSingleStageConfigPayload,
  CampaignValidationItem,
} from "@/contracts/campaigns";
import TargetAudience from "@/services/targetAudience";
import { previewCampaignAudience } from "@/services/campaigns";
import { useWorkspaceStore } from "@/stores/workspace";

const props = withDefaults(defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  channel?: CampaignChannel;
  onSave?: () => void | Promise<void>;
}>(), { errors: () => [], warnings: () => [], loading: false, readonly: false, channel: "sms" });

const model = defineModel<CampaignSingleStageConfigPayload>({ required: true });
const isLoadingAudiences = ref(false);
const targetAudiences = ref<Array<{ id: number; name: string; players?: number }>>([]);
const segmentToAdd = ref("");
const preview = ref<CampaignAudiencePreviewResponse | null>(null);
const isPreviewing = ref(false);
const previewError = ref("");
let previewTimer: number | null = null;
let previewRequest = 0;

const selectedIds = computed<number[]>(() => {
  if (model.value.target_audience_ids?.length) return model.value.target_audience_ids;
  return model.value.target_audience_id ? [model.value.target_audience_id] : [];
});
const selectedSegments = computed(() => selectedIds.value.map((id) =>
  targetAudiences.value.find((audience) => audience.id === id) ?? { id, name: `Segmento #${id}` },
));
const availableAudiences = computed(() => targetAudiences.value.filter((audience) => !selectedIds.value.includes(audience.id)));

onMounted(async () => {
  isLoadingAudiences.value = true;
  try {
    targetAudiences.value = await TargetAudience.list({
      filter_id: useWorkspaceStore().activeGroupProject?.id,
    });
  } finally {
    isLoadingAudiences.value = false;
  }
  schedulePreview(0);
});

watch(
  [
    selectedIds,
    () => props.channel,
    () => model.value.audience_mode,
    () => model.value.apply_protection_list,
    () => model.value.apply_opt_out,
    () => model.value.apply_suppression,
  ],
  () => schedulePreview(),
);

onBeforeUnmount(() => {
  if (previewTimer) window.clearTimeout(previewTimer);
  previewRequest++;
});

function addSegment() {
  const id = Number(segmentToAdd.value);
  if (!id || selectedIds.value.includes(id)) return;
  syncIds([...selectedIds.value, id]);
  if (!model.value.audience_mode || model.value.audience_mode === "none") model.value.audience_mode = "fixed";
  segmentToAdd.value = "";
}

function removeSegment(id: number) {
  syncIds(selectedIds.value.filter((selectedId) => selectedId !== id));
}

function syncIds(ids: number[]) {
  model.value.target_audience_ids = ids;
  model.value.target_audience_id = ids[0] ?? null;
}

function updateCap(field: "daily_recipient_cap" | "total_recipient_cap", value: unknown) {
  model.value[field] = value === "" || value === null || value === undefined ? null : Number(value);
}

function eligibleFor(id: number) {
  return preview.value?.segments.find((segment) => segment.target_audience_id === id)?.total_eligible ?? 0;
}

function previewErrorFor(id: number) {
  return preview.value?.segments.find((segment) => segment.target_audience_id === id)?.error ?? null;
}

function schedulePreview(delay = 350) {
  if (previewTimer) window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(loadPreview, delay);
}

async function loadPreview() {
  if (!selectedIds.value.length) {
    preview.value = null;
    previewError.value = "";
    return;
  }

  const projectId = Number(useWorkspaceStore().activeGroupProject?.project_id);
  if (!projectId) return;
  const request = ++previewRequest;
  isPreviewing.value = true;
  previewError.value = "";

  try {
    const result = await previewCampaignAudience({
      project_id: projectId,
      target_audience_ids: selectedIds.value,
      channel: props.channel,
      audience_mode: model.value.audience_mode,
      apply_protection_list: model.value.apply_protection_list,
      apply_opt_out: model.value.apply_opt_out,
      apply_suppression: model.value.apply_suppression,
    });
    if (request === previewRequest) preview.value = result;
  } catch (error: any) {
    if (request === previewRequest) {
      previewError.value = error?.response?.data?.message || error?.message || "Não foi possível calcular a população elegível.";
    }
  } finally {
    if (request === previewRequest) isPreviewing.value = false;
  }
}
</script>
