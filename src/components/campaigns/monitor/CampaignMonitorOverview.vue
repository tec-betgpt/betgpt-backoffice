<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="rounded-lg border bg-card shadow-sm">
      <h3 class="flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold">
        <Rss class="size-4 text-muted-foreground" />
        Canais
      </h3>
      <div class="divide-y divide-border/50">
        <div v-for="row in rows" :key="row.channel" class="space-y-1.5 px-3 py-2">
          <div class="flex items-center justify-between gap-3 text-sm">
            <div class="flex items-center gap-2 font-medium">
              <span class="flex size-6 items-center justify-center rounded-md bg-muted/60" :class="CAMPAIGN_CHANNEL_TEXT_CLASSES[row.channel]">
                <component :is="CAMPAIGN_CHANNEL_ICONS[row.channel]" class="size-3.5" />
              </span>
              {{ channelLabel(row.channel) }}
              <span class="text-[11px] font-normal text-muted-foreground">{{ formatCount(row.sends) }} envios</span>
              <span v-if="row.errors" class="text-[11px] font-normal text-destructive">{{ formatCount(row.errors) }} erros</span>
            </div>
            <span class="tabular-nums">{{ formatPercent(row.delivery_rate) }}</span>
          </div>
          <Progress :model-value="row.delivery_rate" class="h-1" />
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-card shadow-sm">
      <h3 class="flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold">
        <ChartColumn class="size-4 text-muted-foreground" />
        Métricas
      </h3>
      <dl class="divide-y divide-border/50">
        <div v-for="metric in metrics" :key="metric.label" class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <dt class="flex items-center gap-2 text-muted-foreground">
            <component :is="metric.icon" class="size-3.5" />
            {{ metric.label }}
          </dt>
          <dd class="font-semibold tabular-nums">{{ formatCount(metric.value) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChartColumn, CircleAlert, MailOpen, MailX, MousePointerClick, Rss, TrendingUp, UserMinus } from "lucide-vue-next";
import { Progress } from "@/components/ui/progress";
import type { CampaignChannelMetrics, CampaignMonitorTotals } from "@/contracts/campaignMonitor";
import { MARKETING_CHANNEL_LABELS, type MarketingChannel } from "@/contracts/marketingAssets";
import { channelRows } from "./campaignMonitorView";
import { CAMPAIGN_CHANNEL_ICONS, CAMPAIGN_CHANNEL_TEXT_CLASSES } from "../campaignPresentation";

const props = defineProps<{
  channels: Record<MarketingChannel, CampaignChannelMetrics>;
  totals: CampaignMonitorTotals;
}>();

const rows = computed(() => channelRows(props.channels));
const metrics = computed(() => [
  { label: "Aberturas", value: props.totals.opens, icon: MailOpen },
  { label: "Cliques", value: props.totals.clicks, icon: MousePointerClick },
  { label: "Bounces", value: props.totals.bounces, icon: CircleAlert },
  { label: "Conversões", value: props.totals.conversions, icon: TrendingUp },
  { label: "Erros", value: props.totals.errors, icon: MailX },
  { label: "Inscrições removidas", value: props.totals.opt_outs, icon: UserMinus },
]);

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
}

function channelLabel(channel: MarketingChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}
</script>
