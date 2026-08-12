<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="flex flex-wrap items-center gap-2">
        Execução
        <Badge :variant="statusVariant">
          {{ CAMPAIGN_RUN_STATUS_LABELS[run.status] }}
        </Badge>
      </CardTitle>
      <CardDescription class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="font-mono">#{{ run.id }}</span>
        <span class="text-muted-foreground">·</span>
        <span>Total: {{ run.total_recipients }}</span>
        <span v-if="eta" class="text-muted-foreground">·</span>
        <span v-if="eta">ETA: {{ eta }}</span>
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <div>
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-medium">Progresso</div>
          <div class="text-sm text-muted-foreground">{{ percent.toFixed(0) }}%</div>
        </div>
        <Progress class="mt-2" :model-value="percent" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-md border p-3">
          <div class="text-xs text-muted-foreground">Pendente</div>
          <div class="text-lg font-semibold">{{ counts.pending }}</div>
        </div>
        <div class="rounded-md border p-3">
          <div class="text-xs text-muted-foreground">Processando</div>
          <div class="text-lg font-semibold">{{ counts.processing }}</div>
        </div>
        <div class="rounded-md border p-3">
          <div class="text-xs text-muted-foreground">Enviado</div>
          <div class="text-lg font-semibold">{{ counts.sent }}</div>
        </div>
        <div class="rounded-md border p-3">
          <div class="text-xs text-muted-foreground">Falhou</div>
          <div class="text-lg font-semibold">{{ counts.failed }}</div>
        </div>
        <div class="rounded-md border p-3">
          <div class="text-xs text-muted-foreground">Cancelado</div>
          <div class="text-lg font-semibold">{{ counts.canceled }}</div>
        </div>
        <div v-if="counts.dead_letter !== undefined" class="rounded-md border p-3">
          <div class="text-xs text-muted-foreground">Dead letter</div>
          <div class="text-lg font-semibold">{{ counts.dead_letter }}</div>
        </div>
      </div>

      <details v-if="run.last_error" class="rounded-md border p-3">
        <summary class="cursor-pointer text-sm font-medium">
          Último erro
          <span class="ml-1 text-xs text-muted-foreground">
            (atualizado em {{ formatDateTime(run.updated_at) }})
          </span>
        </summary>
        <pre class="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs text-destructive">{{
          run.last_error
        }}</pre>
      </details>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CAMPAIGN_RUN_STATUS_LABELS,
  type CampaignRun,
  type CampaignRunCounts,
} from "@/contracts/campaignExecution";

const props = defineProps<{
  run: CampaignRun;
}>();

const counts = computed<CampaignRunCounts>(() => props.run.counts);

const eta = computed(() => props.run.metadata?.progress?.eta ?? null);

const percent = computed(() => {
  const explicit = props.run.metadata?.progress?.percent;
  if (typeof explicit === "number" && Number.isFinite(explicit)) {
    return clamp(explicit, 0, 100);
  }

  const total = props.run.total_recipients || 0;
  if (!total) return 0;

  // Fallback com counts: quanto já "saiu" do estado pending.
  const pending = props.run.counts.pending ?? 0;
  return clamp(((total - pending) / total) * 100, 0, 100);
});

const statusVariant = computed(() => {
  const status = props.run.status;
  if (status === "running") return "default";
  if (status === "paused") return "secondary";
  if (status === "completed") return "default";
  if (status === "failed" || status === "canceled") return "destructive";
  return "outline"; // prepared
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
</script>

