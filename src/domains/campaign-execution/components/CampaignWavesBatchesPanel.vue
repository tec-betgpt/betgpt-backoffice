<template>
  <Card>
    <CardHeader class="pb-2">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Waves e batches</CardTitle>
          <CardDescription>
            Auditoria operacional por wave/lote (ordem de sequência, status, retries e timestamps).
          </CardDescription>
        </div>

        <Button
          v-if="campaignId"
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="onRefreshBatches"
        >
          {{ loading ? "Atualizando..." : "Atualizar lotes" }}
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      <div v-if="wavesSorted.length === 0" class="py-6 text-sm text-muted-foreground">
        Nenhuma wave encontrada para esta execução.
      </div>

      <Accordion v-else type="multiple" class="w-full">
        <AccordionItem
          v-for="wave in wavesSorted"
          :key="wave.id"
          :value="String(wave.id)"
        >
          <AccordionTrigger class="hover:no-underline">
            <div class="flex w-full flex-wrap items-center justify-between gap-2 pr-2">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <span class="truncate text-sm font-medium">Wave {{ wave.sequence }}</span>
                <Badge :variant="waveStatusVariant(wave.status)">
                  {{ wave.status }}
                </Badge>
                <span class="text-xs text-muted-foreground">
                  {{ wave.batches?.length ?? 0 }} batch(es)
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Agend.: {{ formatDateTime(wave.scheduled_at) }}</span>
                <span>Início: {{ formatDateTime(wave.started_at) }}</span>
                <span>Fim: {{ formatDateTime(wave.finished_at) }}</span>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <div class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Tentativas</TableHead>
                    <TableHead>Próx. retry</TableHead>
                    <TableHead>Agendado</TableHead>
                    <TableHead>Iniciado</TableHead>
                    <TableHead>Finalizado</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="batchesSorted(wave).length === 0">
                    <TableCell colspan="9" class="py-6 text-center text-muted-foreground">
                      Nenhum batch.
                    </TableCell>
                  </TableRow>

                  <TableRow v-for="batch in batchesSorted(wave)" :key="batch.id">
                    <TableCell>
                      <div class="font-medium">#{{ batch.sequence }}</div>
                      <div class="text-xs text-muted-foreground">id {{ batch.id }}</div>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="batchStatusVariant(batch.status)">
                        {{ batch.status }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right">{{ batch.attempts }}</TableCell>
                    <TableCell>{{ formatDateTime(batch.next_retry_at) }}</TableCell>
                    <TableCell>{{ formatDateTime(batch.scheduled_at) }}</TableCell>
                    <TableCell>{{ formatDateTime(batch.started_at) }}</TableCell>
                    <TableCell>{{ formatDateTime(batch.finished_at) }}</TableCell>
                    <TableCell class="min-w-[160px]">
                      <div v-if="batchPercent(batch) !== null">
                        <Progress :model-value="batchPercent(batch) || 0" />
                        <div class="mt-1 text-xs text-muted-foreground">
                          {{ (batchPercent(batch) || 0).toFixed(0) }}%
                        </div>
                      </div>
                      <span v-else class="text-xs text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell class="min-w-[220px]">
                      <details v-if="batch.last_error" class="text-xs">
                        <summary class="cursor-pointer text-destructive">
                          Ver erro
                        </summary>
                        <pre class="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs text-destructive">{{
                          batch.last_error
                        }}</pre>
                      </details>
                      <span v-else class="text-xs text-muted-foreground">—</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignBatch, CampaignWave } from "@/contracts/campaignExecution";

const props = defineProps<{
  campaignId: number | null;
  waves: CampaignWave[];
  loading?: boolean;
  onRefreshBatches?: () => void | Promise<void>;
}>();

const loading = computed(() => Boolean(props.loading));

const wavesSorted = computed(() =>
  [...(props.waves || [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
);

function batchesSorted(wave: CampaignWave) {
  return [...(wave.batches || [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
}

function onRefreshBatches() {
  if (!props.onRefreshBatches) return;
  return props.onRefreshBatches();
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function waveStatusVariant(status: CampaignWave["status"]) {
  if (status === "running") return "default";
  if (status === "paused") return "secondary";
  if (status === "failed" || status === "canceled") return "destructive";
  return "outline"; // pending/completed
}

function batchStatusVariant(status: CampaignBatch["status"]) {
  if (status === "running") return "default";
  if (status === "paused") return "secondary";
  if (status === "failed" || status === "canceled") return "destructive";
  return "outline"; // pending/completed
}

function batchPercent(batch: CampaignBatch): number | null {
  const viaField = batch.progress?.percent;
  if (typeof viaField === "number" && Number.isFinite(viaField)) return clamp(viaField, 0, 100);

  const viaMetadata = batch.metadata?.progress?.percent;
  if (typeof viaMetadata === "number" && Number.isFinite(viaMetadata)) return clamp(viaMetadata, 0, 100);

  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
</script>

