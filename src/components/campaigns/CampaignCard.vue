<template>
  <Card
    data-test="campaign-card"
    role="button"
    tabindex="0"
    :aria-label="`Abrir monitor da campanha ${campaign.name}`"
    class="cursor-pointer overflow-hidden border transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
    @click="emit('open', campaign)"
    @keydown.enter.self="emit('open', campaign)"
    @keydown.space.prevent.self="emit('open', campaign)"
  >
    <div v-if="campaign.status === 'draft'" class="bg-amber-100 px-4 py-1.5 text-center text-xs font-semibold text-amber-800">
      Rascunho — ainda não publicada
    </div>

    <CardHeader class="space-y-3 pb-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <Badge :variant="statusVariant">{{ statusLabel }}</Badge>
            <Badge variant="outline">{{ typeLabel }}</Badge>
          </div>
          <CardTitle class="break-words text-lg leading-tight">{{ campaign.name }}</CardTitle>
          <CardDescription v-if="campaign.description" class="line-clamp-2">{{ campaign.description }}</CardDescription>
        </div>
        <div class="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            :aria-label="campaign.status === 'draft' ? 'Editar campanha' : 'Abrir configuração'"
            :title="campaign.status === 'draft' ? 'Editar campanha' : 'Abrir configuração'"
            @click.stop="emit('edit', campaign)"
          >
            <Pencil class="size-4" />
          </Button>
          <Button
            v-if="campaign.status === 'draft'"
            variant="ghost"
            size="icon"
            class="text-destructive hover:text-destructive"
            aria-label="Excluir campanha"
            title="Excluir campanha"
            :disabled="deleting"
            @click.stop="emit('delete', campaign)"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="channel in channels"
            :key="channel"
            class="flex size-8 items-center justify-center rounded-md border"
            :class="CAMPAIGN_CHANNEL_COLOR_CLASSES[channel]"
            :title="channelLabel(channel)"
          >
            <component :is="CAMPAIGN_CHANNEL_ICONS[channel]" class="size-4" />
            <span class="sr-only">{{ channelLabel(channel) }}</span>
          </span>
        </div>
        <span v-if="campaign.project?.name" class="truncate text-xs text-muted-foreground">{{ campaign.project.name }}</span>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="grid grid-cols-4 gap-2">
        <div v-for="metric in metricRows" :key="metric.label" class="min-w-0">
          <div class="flex items-center gap-1 text-[11px] text-muted-foreground">
            <component :is="metric.icon" class="size-3.5 shrink-0" />
            <span class="truncate">{{ metric.label }}</span>
          </div>
          <div class="mt-1 text-lg font-semibold">{{ formatNumber(metric.value) }}</div>
        </div>
      </div>

      <div class="space-y-2 border-t pt-3 text-xs text-muted-foreground">
        <div class="flex items-center gap-2" :title="allSegmentNames">
          <Users class="size-4 shrink-0" />
          <span class="truncate">{{ segmentLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Repeat2 class="size-4 shrink-0" />
          <span>{{ recurrenceLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Send class="size-4 shrink-0" />
          <span>Último envio: {{ lastSendLabel }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 text-xs">
        <span class="text-muted-foreground">Alterada às {{ updateTime }}</span>
        <span class="flex items-center gap-1 font-medium text-primary">Abrir monitor <ArrowUpRight class="size-3.5" /></span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  ArrowUpRight,
  MailOpen,
  MousePointerClick,
  Pencil,
  Repeat2,
  Send,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type CampaignChannel,
  type CampaignListItem,
  type CampaignStatus,
} from "@/contracts/campaigns";
import { MARKETING_CHANNEL_LABELS } from "@/contracts/marketingAssets";
import { CAMPAIGN_CHANNEL_COLOR_CLASSES, CAMPAIGN_CHANNEL_ICONS } from "./campaignPresentation";

const props = withDefaults(defineProps<{
  campaign: CampaignListItem;
  deleting?: boolean;
}>(), { deleting: false });
const emit = defineEmits<{
  open: [campaign: CampaignListItem];
  edit: [campaign: CampaignListItem];
  delete: [campaign: CampaignListItem];
}>();

const channels = computed(() => props.campaign.channels?.length ? props.campaign.channels : [props.campaign.channel]);
const statusLabel = computed(() => CAMPAIGN_STATUS_LABELS[props.campaign.status]);
const statusVariant = computed(() => statusVariantFor(props.campaign.status));
const typeLabel = computed(() => CAMPAIGN_TYPE_LABELS[props.campaign.type]);
const metricRows = computed(() => [
  { label: "Envios", value: props.campaign.metrics?.sends ?? 0, icon: Send },
  { label: "Aberturas", value: props.campaign.metrics?.opens ?? 0, icon: MailOpen },
  { label: "Cliques", value: props.campaign.metrics?.clicks ?? 0, icon: MousePointerClick },
  { label: "Conversões", value: props.campaign.metrics?.conversions ?? 0, icon: TrendingUp },
]);
const allSegmentNames = computed(() => (props.campaign.target_audiences || []).map((segment) => segment.name).join(", "));
const segmentLabel = computed(() => {
  const segments = props.campaign.target_audiences || [];
  if (!segments.length) return "Sem segmento";
  return segments.length === 1 ? segments[0].name : `${segments[0].name} +${segments.length - 1}`;
});
const recurrenceLabel = computed(() => {
  const recurrence = props.campaign.recurrence_policy;
  if (!recurrence?.is_enabled) return "Sem repetição";
  const interval = recurrence.interval || 1;
  if (interval === 1) return { daily: "Diária", weekly: "Semanal", monthly: "Mensal" }[recurrence.frequency || "weekly"];
  const unit = { daily: "dias", weekly: "semanas", monthly: "meses" }[recurrence.frequency || "weekly"];
  return `A cada ${interval} ${unit}`;
});
const lastSendLabel = computed(() => formatDateTime(props.campaign.last_sent_at || null));
const updateTime = computed(() => {
  const date = new Date(props.campaign.updated_at);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
});

function channelLabel(channel: CampaignChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Nunca enviada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function statusVariantFor(status: CampaignStatus) {
  if (status === "draft" || status === "validated") return "outline";
  if (["validation_failed", "canceled", "archived"].includes(status)) return "destructive";
  if (status === "validating" || status === "paused") return "secondary";
  return "default";
}
</script>
