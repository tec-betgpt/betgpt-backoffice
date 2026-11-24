<template>
  <aside class="space-y-3 lg:sticky lg:top-4">
    <div class="rounded-lg border bg-card shadow-sm">
      <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h3 class="flex items-center gap-2 text-sm font-semibold">
          <Users class="size-4 text-muted-foreground" />
          Público da campanha
        </h3>
        <Button
          variant="ghost"
          size="icon"
          class="size-7"
          title="Atualizar estimativa"
          aria-label="Atualizar estimativa"
          :disabled="!campaignId || loading"
          @click="emit('refresh')"
        >
          <RefreshCw class="size-3.5" :class="loading ? 'animate-spin' : ''" />
        </Button>
      </div>

      <div class="space-y-3 px-4 py-3">
        <p v-if="!campaignId" class="text-xs text-muted-foreground">
          Salve a primeira etapa para calcular quantas pessoas vão receber.
        </p>
        <p v-else-if="errorMessage && !estimate" class="text-xs text-destructive">{{ errorMessage }}</p>

        <div class="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
          <div class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Elegíveis para envio</div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold tabular-nums">{{ formatValue(audience?.eligible) }}</span>
            <span v-if="audience" class="text-[11px] text-muted-foreground">
              {{ formatValue(audience.estimated_recipients) }} destinatário(s) estimado(s)
            </span>
          </div>
        </div>

        <dl class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div>
            <dt class="text-muted-foreground">No segmento</dt>
            <dd class="font-semibold tabular-nums">{{ formatValue(audience?.total) }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">{{ contactLabel }}</dt>
            <dd class="font-semibold tabular-nums">{{ formatValue(audience?.without_phone) }}</dd>
          </div>
          <div>
            <dt class="flex items-center gap-1 text-muted-foreground"><ShieldBan class="size-3" /> Blacklist</dt>
            <dd class="font-semibold tabular-nums text-red-500">{{ formatValue(audience?.protected) }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Supressão</dt>
            <dd class="font-semibold tabular-nums">{{ formatValue(audience?.suppressed) }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Opt-out</dt>
            <dd class="font-semibold tabular-nums">{{ formatValue(audience?.opted_out) }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Limite diário</dt>
            <dd class="font-semibold tabular-nums">{{ capLabel(form.single_stage_config.daily_recipient_cap) }}</dd>
          </div>
        </dl>

        <div class="space-y-1 border-t pt-2 text-xs">
          <div class="text-muted-foreground">Segmentos</div>
          <div v-if="segmentNames.length" class="flex flex-wrap gap-1">
            <span v-for="name in segmentNames" :key="name" class="rounded border bg-muted/40 px-1.5 py-0.5">{{ name }}</span>
          </div>
          <span v-else class="text-amber-500">Nenhum segmento selecionado</span>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-card shadow-sm">
      <h3 class="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
        <ClipboardList class="size-4 text-muted-foreground" />
        Detalhes da campanha
      </h3>
      <dl class="divide-y text-xs">
        <div class="flex items-center justify-between gap-3 px-4 py-2">
          <dt class="text-muted-foreground">Nome</dt>
          <dd class="truncate font-medium" :title="form.name">{{ form.name || "—" }}</dd>
        </div>
        <div class="flex items-start justify-between gap-3 px-4 py-2">
          <dt class="text-muted-foreground">Canais</dt>
          <dd class="flex flex-col items-end gap-1">
            <span v-for="message in form.messages" :key="message.channel" class="flex items-center gap-1.5">
              <component :is="CAMPAIGN_CHANNEL_ICONS[message.channel || form.channel]" class="size-3.5" :class="CAMPAIGN_CHANNEL_TEXT_CLASSES[message.channel || form.channel]" />
              <span class="max-w-[150px] truncate" :class="hasContent(message) ? '' : 'text-amber-500'">
                {{ hasContent(message) ? (message.asset?.name || channelLabel(message.channel || form.channel)) : "Sem template" }}
              </span>
            </span>
            <span v-if="!form.messages.length" class="text-amber-500">Nenhum canal</span>
          </dd>
        </div>
        <div class="flex items-center justify-between gap-3 px-4 py-2">
          <dt class="text-muted-foreground">Envio</dt>
          <dd class="font-medium">{{ scheduleLabel }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3 px-4 py-2">
          <dt class="text-muted-foreground">Repetição</dt>
          <dd class="font-medium">{{ recurrenceLabel }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3 px-4 py-2">
          <dt class="text-muted-foreground">Dias de envio</dt>
          <dd class="font-medium">{{ daysLabel }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3 px-4 py-2">
          <dt class="text-muted-foreground">Warmup</dt>
          <dd class="font-medium">{{ form.warmup_policy.is_enabled ? "Ativo" : "Desligado" }}</dd>
        </div>
        <div v-if="estimate?.financial.estimated_cost !== null && estimate?.financial.estimated_cost !== undefined" class="flex items-center justify-between gap-3 px-4 py-2">
          <dt class="text-muted-foreground">Custo estimado</dt>
          <dd class="font-semibold">{{ formatMoney(estimate.financial.estimated_cost, estimate.financial.currency) }}</dd>
        </div>
      </dl>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ClipboardList, RefreshCw, ShieldBan, Users } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_DAY_OPTIONS,
  type CampaignChannel,
  type CampaignEstimateResponse,
  type CampaignFormState,
  type CampaignMessagePayload,
  type CampaignTargetAudienceSummary,
} from "@/contracts/campaigns";
import { MARKETING_CHANNEL_LABELS } from "@/contracts/marketingAssets";
import { CAMPAIGN_CHANNEL_ICONS, CAMPAIGN_CHANNEL_TEXT_CLASSES } from "./campaignPresentation";

const props = withDefaults(defineProps<{
  form: CampaignFormState;
  estimate: CampaignEstimateResponse | null;
  loading?: boolean;
  errorMessage?: string;
  campaignId: number | null;
  segments?: CampaignTargetAudienceSummary[];
}>(), { loading: false, errorMessage: "", segments: () => [] });

const emit = defineEmits<{ (event: "refresh"): void }>();

const audience = computed(() => props.estimate?.audience ?? null);
const isEmailOnly = computed(() => props.form.messages.length > 0 && props.form.messages.every((message) => message.channel === "email"));
const contactLabel = computed(() => (isEmailOnly.value ? "Sem e-mail" : "Sem contato"));
const segmentNames = computed(() => {
  const ids = props.form.single_stage_config.target_audience_ids ?? [];
  const byId = new Map(props.segments.map((segment) => [segment.id, segment.name]));
  const names = ids.map((id) => byId.get(id)).filter((name): name is string => Boolean(name));
  if (names.length) return names;
  return audience.value?.target_audience_name ? [audience.value.target_audience_name] : [];
});
const scheduleLabel = computed(() => {
  const startsAt = props.form.schedule.starts_at;
  if (!startsAt) return "Imediato";
  const date = new Date(startsAt);
  return Number.isNaN(date.getTime())
    ? startsAt
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
});
const recurrenceLabel = computed(() => {
  const recurrence = props.form.recurrence_policy;
  if (!recurrence.is_enabled) return "Uma vez";
  const interval = recurrence.interval || 1;
  const frequency = recurrence.frequency || "weekly";
  if (interval === 1) return { daily: "Diária", weekly: "Semanal", monthly: "Mensal" }[frequency];
  return `A cada ${interval} ${{ daily: "dias", weekly: "semanas", monthly: "meses" }[frequency]}`;
});
const daysLabel = computed(() => {
  const active = props.form.delivery_windows.filter((window) => window.is_active !== false);
  if (!active.length || active.length >= 7) return "Todos os dias";
  const days = Array.from(new Set(active.map((window) => window.day_of_week)));
  return days
    .map((day) => CAMPAIGN_DAY_OPTIONS.find((option) => option.value === day)?.label.slice(0, 3))
    .filter(Boolean)
    .join(", ");
});

function hasContent(message: CampaignMessagePayload) {
  return Boolean(message.asset_id || message.body?.trim());
}

function channelLabel(channel: CampaignChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}

function formatValue(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function capLabel(value: number | null | undefined) {
  return value ? formatValue(value) : "Sem limite";
}

function formatMoney(value: number, currency: string | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(value);
}
</script>
