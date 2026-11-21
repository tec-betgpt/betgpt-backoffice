<template>
  <div class="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
    <Card>
      <CardHeader>
        <CardTitle>Visão geral por canal</CardTitle>
        <CardDescription>Entregas em relação aos envios de cada canal.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div v-for="row in rows" :key="row.channel" class="space-y-2">
          <div class="flex items-center justify-between gap-3 text-sm">
            <div class="flex items-center gap-2 font-medium">
              <span class="flex size-7 items-center justify-center rounded-md border" :class="CAMPAIGN_CHANNEL_COLOR_CLASSES[row.channel]">
                <component :is="CAMPAIGN_CHANNEL_ICONS[row.channel]" class="size-3.5" />
              </span>
              {{ channelLabel(row.channel) }}
              <Badge variant="outline">{{ row.sends }} envios</Badge>
            </div>
            <span class="text-muted-foreground">{{ row.delivery_rate.toFixed(1) }}%</span>
          </div>
          <Progress :model-value="row.delivery_rate" />
          <p class="text-xs text-muted-foreground">{{ row.deliveries }} entregues · {{ row.errors }} erros</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Métricas</CardTitle>
        <CardDescription>Totais consolidados da campanha.</CardDescription>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-3">
        <div v-for="metric in metrics" :key="metric.label" class="rounded-md border p-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <component :is="metric.icon" class="size-3.5" />
            {{ metric.label }}
          </div>
          <div class="mt-1 text-xl font-semibold">{{ metric.value }}</div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CircleAlert, MailOpen, MousePointerClick, TrendingUp, UserMinus } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CampaignChannelMetrics, CampaignMonitorTotals } from "@/contracts/campaignMonitor";
import { MARKETING_CHANNEL_LABELS, type MarketingChannel } from "@/contracts/marketingAssets";
import { channelRows } from "./campaignMonitorView";
import { CAMPAIGN_CHANNEL_COLOR_CLASSES, CAMPAIGN_CHANNEL_ICONS } from "../campaignPresentation";

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
  { label: "Inscrições removidas", value: props.totals.opt_outs, icon: UserMinus },
]);

function channelLabel(channel: MarketingChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}
</script>
