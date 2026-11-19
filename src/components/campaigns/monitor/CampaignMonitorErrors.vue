<template>
  <Card>
    <CardHeader>
      <CardTitle>Erros da campanha</CardTitle>
      <CardDescription>Falhas operacionais e eventos de erro mais recentes.</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="items.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum erro registrado.
      </div>
      <div v-else class="space-y-3">
        <div v-for="item in items" :key="item.id" class="rounded-md border border-destructive/30 p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <Badge variant="destructive">{{ channelLabel(item.channel) }}</Badge>
                <Badge variant="outline">{{ item.source }}</Badge>
                <span v-if="item.node_id" class="text-xs text-muted-foreground">Nó: {{ item.node_id }}</span>
              </div>
              <p class="mt-2 text-sm">{{ item.message }}</p>
              <p v-if="item.contact" class="mt-1 text-xs text-muted-foreground">Contato: {{ item.contact }}</p>
            </div>
            <time class="text-xs text-muted-foreground">{{ formatDateTime(item.occurred_at) }}</time>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignMonitorErrorItem } from "@/contracts/campaignMonitor";
import { MARKETING_CHANNEL_LABELS, type MarketingChannel } from "@/contracts/marketingAssets";

defineProps<{ items: CampaignMonitorErrorItem[] }>();

function channelLabel(channel: MarketingChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
</script>
