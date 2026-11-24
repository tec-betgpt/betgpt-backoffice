<template>
  <div
    data-test="campaign-card"
    role="button"
    tabindex="0"
    :aria-label="`Abrir campanha ${campaign.name}`"
    class="flex cursor-pointer rounded-lg border border-border bg-gradient-to-br from-card to-card/95 text-card-foreground shadow-sm transition-all hover:border-primary/20 hover:from-card/95 hover:to-card/80 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-transparent"
    @click="emit('open', campaign)"
    @keydown.enter.self="emit('open', campaign)"
    @keydown.space.prevent.self="emit('open', campaign)"
  >
    <div class="w-full flex-1 p-4">
      <div class="flex w-full items-center justify-between gap-2">
        <component :is="typeIcon" class="size-6 shrink-0" :class="typeIconClass" />
        <h4 class="flex-1 truncate text-base font-semibold" :title="campaign.name">{{ campaign.name }}</h4>
        <div class="flex shrink-0 items-center gap-2">
          <span
            v-if="showStatusBadge"
            class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
            :class="CAMPAIGN_STATUS_BADGE_CLASSES[campaign.status]"
          >
            <span class="size-1.5 rounded-full bg-current" />
            {{ statusLabel }}
          </span>
          <span class="flex items-center -space-x-1.5">
            <span
              v-for="channel in channels"
              :key="channel"
              class="flex size-[26px] items-center justify-center rounded-full bg-muted ring-2 ring-card"
              :class="CAMPAIGN_CHANNEL_TEXT_CLASSES[channel]"
              :title="channelLabel(channel)"
            >
              <component :is="CAMPAIGN_CHANNEL_ICONS[channel]" class="size-3.5" />
              <span class="sr-only">{{ channelLabel(channel) }}</span>
            </span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="size-7" aria-label="Abrir menu" @click.stop>
                <Ellipsis class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" @click.stop>
              <DropdownMenuItem @select="emit('open', campaign)">
                <ArrowUpRight class="mr-2 size-4" /> Abrir campanha
              </DropdownMenuItem>
              <DropdownMenuItem @select="emit('edit', campaign)">
                <Pencil class="mr-2 size-4" /> {{ campaign.status === "draft" ? "Editar campanha" : "Ver configuração" }}
              </DropdownMenuItem>
              <template v-if="campaign.status === 'draft'">
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-destructive focus:text-destructive" :disabled="deleting" @select="emit('delete', campaign)">
                  <Trash2 class="mr-2 size-4" /> Excluir campanha
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-4 gap-1">
        <div
          v-for="metric in metricRows"
          :key="metric.label"
          class="flex flex-col items-center justify-center rounded-md border border-border/50 bg-muted/15 px-1 py-1 dark:bg-muted/50"
        >
          <p class="text-xs font-medium text-muted-foreground">{{ metric.label }}</p>
          <p class="whitespace-nowrap text-xs font-semibold tracking-tighter">
            {{ metric.value }}
            <span v-if="metric.rate" class="font-normal text-muted-foreground">({{ metric.rate }})</span>
          </p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
        <span class="inline-flex min-w-0 items-center gap-1" :title="allSegmentNames">
          <Users class="size-3 shrink-0" />
          <span class="max-w-[150px] truncate">{{ segmentLabel }}</span>
        </span>
        <span class="inline-flex shrink-0 items-center gap-1">
          <Repeat class="size-3" />
          {{ recurrenceLabel }}
        </span>
        <span v-if="lastSendLabel" class="inline-flex shrink-0 items-center gap-1">
          <Clock class="size-3" />
          Último envio: {{ lastSendLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  ArrowUpRight,
  Clock,
  Ellipsis,
  GitFork,
  Pencil,
  Repeat,
  Send,
  Trash2,
  Users,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CAMPAIGN_STATUS_LABELS,
  type CampaignChannel,
  type CampaignListItem,
} from "@/contracts/campaigns";
import { MARKETING_CHANNEL_LABELS } from "@/contracts/marketingAssets";
import {
  CAMPAIGN_CHANNEL_ICONS,
  CAMPAIGN_CHANNEL_TEXT_CLASSES,
  CAMPAIGN_STATUS_BADGE_CLASSES,
  formatCampaignNumber,
  formatCampaignRate,
  formatRelativeTime,
} from "./campaignPresentation";

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
const showStatusBadge = computed(() => props.campaign.status !== "running");
const typeIcon = computed(() => {
  if (props.campaign.status === "draft") return Pencil;
  return props.campaign.type === "flow" ? GitFork : Send;
});
const typeIconClass = computed(() => (props.campaign.status === "draft" ? "text-amber-500" : "text-blue-500"));
const metricRows = computed(() => {
  const metrics = props.campaign.metrics;
  const sends = metrics?.sends ?? 0;
  const opens = metrics?.opens ?? 0;
  const clicks = metrics?.clicks ?? 0;
  return [
    { label: "Envios", value: formatCampaignNumber(sends), rate: null },
    { label: "Aberturas", value: formatCampaignNumber(opens), rate: formatCampaignRate(opens, sends) },
    { label: "Cliques", value: formatCampaignNumber(clicks), rate: formatCampaignRate(clicks, opens || sends) },
    { label: "Conversões", value: formatCampaignNumber(metrics?.conversions ?? 0), rate: null },
  ];
});
const allSegmentNames = computed(() => (props.campaign.target_audiences || []).map((segment) => segment.name).join(", "));
const segmentLabel = computed(() => {
  const segments = props.campaign.target_audiences || [];
  if (!segments.length) return "Sem segmento";
  return segments.length === 1 ? segments[0].name : `${segments[0].name} +${segments.length - 1}`;
});
const recurrenceLabel = computed(() => {
  const recurrence = props.campaign.recurrence_policy;
  if (!recurrence?.is_enabled) return "Uma vez";
  const interval = recurrence.interval || 1;
  if (interval === 1) return { daily: "Diária", weekly: "Semanal", monthly: "Mensal" }[recurrence.frequency || "weekly"];
  const unit = { daily: "dias", weekly: "semanas", monthly: "meses" }[recurrence.frequency || "weekly"];
  return `A cada ${interval} ${unit}`;
});
const lastSendLabel = computed(() => formatRelativeTime(props.campaign.last_sent_at));

function channelLabel(channel: CampaignChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}
</script>
