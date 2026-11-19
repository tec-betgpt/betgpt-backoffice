<template>
  <Card>
    <CardHeader>
      <CardTitle>Histórico de lotes</CardTitle>
      <CardDescription>Envios agrupados por ocorrência, batch ou nó do fluxo.</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="items.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum lote registrado até o momento.
      </div>
      <ol v-else class="space-y-4 border-l pl-5">
        <li v-for="item in items" :key="item.id" class="relative rounded-md border p-4">
          <span class="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-background bg-primary" />
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="font-medium">{{ item.message }}</div>
              <div class="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{{ channelLabel(item.channel) }}</Badge>
                <Badge variant="secondary">{{ item.status }}</Badge>
                <span>{{ item.sent_count }} enviadas</span>
                <span v-if="item.failed_count">{{ item.failed_count }} falhas</span>
              </div>
            </div>
            <time class="text-xs text-muted-foreground">{{ formatDateTime(item.occurred_at) }}</time>
          </div>
        </li>
      </ol>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignMonitorHistoryItem } from "@/contracts/campaignMonitor";
import { MARKETING_CHANNEL_LABELS, type MarketingChannel } from "@/contracts/marketingAssets";

defineProps<{ items: CampaignMonitorHistoryItem[] }>();

function channelLabel(channel: MarketingChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
</script>
