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
          <div class="text-xs text-muted-foreground">{{ metric.label }}</div>
          <div class="text-xl font-semibold">{{ metric.value }}</div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CampaignChannelMetrics, CampaignMonitorTotals } from "@/contracts/campaignMonitor";
import { MARKETING_CHANNEL_LABELS, type MarketingChannel } from "@/contracts/marketingAssets";
import { channelRows } from "./campaignMonitorView";

const props = defineProps<{
  channels: Record<MarketingChannel, CampaignChannelMetrics>;
  totals: CampaignMonitorTotals;
}>();

const rows = computed(() => channelRows(props.channels));
const metrics = computed(() => [
  { label: "Aberturas", value: props.totals.opens },
  { label: "Cliques", value: props.totals.clicks },
  { label: "Bounces", value: props.totals.bounces },
  { label: "Conversões", value: props.totals.conversions },
  { label: "Inscrições removidas", value: props.totals.opt_outs },
]);

function channelLabel(channel: MarketingChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}
</script>
