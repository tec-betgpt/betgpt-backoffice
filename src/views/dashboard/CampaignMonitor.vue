<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Monitor de Campanha</h2>
        <p class="text-muted-foreground">
          Acompanhamento operacional em tempo real: envio, entrega, cliques e previsão de conclusão.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Badge v-if="lastUpdatedAt" variant="outline">
          Atualizado {{ formatDateTime(lastUpdatedAt) }}
        </Badge>
        <Button variant="outline" size="sm" :disabled="isRefreshing" @click="refresh(true)">
          <RefreshCw :class="['mr-2 h-4 w-4', isRefreshing ? 'animate-spin' : '']" />
          Atualizar
        </Button>
      </div>
    </div>

    <Card>
      <CardContent class="flex flex-col gap-4 py-4 lg:flex-row lg:items-center">
        <div class="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center">
          <Label class="text-nowrap">Campanha</Label>
          <Select v-model="selectedCampaignId" @update:model-value="onCampaignChange">
            <SelectTrigger class="w-full lg:w-[360px]">
              <SelectValue placeholder="Selecione uma campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="campaign in campaigns" :key="campaign.id" :value="String(campaign.id)">
                #{{ campaign.id }} — {{ campaign.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge v-if="monitor" :variant="statusVariant(monitor.campaign_status)">
          {{ statusLabel(monitor.campaign_status) }}
        </Badge>
        <Badge v-if="monitor?.run" variant="outline">
          Run #{{ monitor.run.id }} · {{ runStatusLabel(monitor.run.status) }}
        </Badge>
      </CardContent>
    </Card>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Falha ao carregar o monitor</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <template v-if="isInitialLoading">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton v-for="item in 8" :key="item" class="h-28 w-full" />
      </div>
      <Skeleton class="h-72 w-full" />
      <Skeleton class="h-96 w-full" />
    </template>

    <template v-else-if="monitor">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Destinatários</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatInteger(monitor.run?.counts.total_recipients) }}</div>
            <p class="text-xs text-muted-foreground">Total da execução atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Enviados</CardTitle>
            <Send class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatInteger(monitor.run?.counts.sent) }}</div>
            <p class="text-xs text-muted-foreground">Aceitos pelo provider</p>
          </CardContent>
        </Card>

        <Card :class="failedCount > 0 ? 'border-destructive bg-destructive/5' : ''">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Falhas</CardTitle>
            <AlertTriangle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div :class="['text-2xl font-bold', failedCount > 0 ? 'text-destructive' : '']">
              {{ formatInteger(failedCount) }}
            </div>
            <p class="text-xs text-muted-foreground">Falhas de envio/entrega</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Pendentes</CardTitle>
            <Hourglass class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatInteger(monitor.run?.counts.pending) }}</div>
            <p class="text-xs text-muted-foreground">
              Aguardando envio
              <span v-if="monitor.run?.counts.processing">· {{ formatInteger(monitor.run.counts.processing) }} processando</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle>Eventos por tipo</CardTitle>
            <CardDescription>
              Contagem de eventos canônicos nas últimas 24h.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="item in eventMetricItems"
              :key="item.key"
              class="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span class="text-sm text-muted-foreground">{{ item.label }}</span>
              <span class="text-lg font-bold">{{ formatInteger(item.value) }}</span>
            </div>

            <Separator />

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-md border p-3">
                <p class="text-xs text-muted-foreground">Taxa de entrega</p>
                <p class="mt-1 text-xl font-bold">{{ formatPercent(monitor.events.delivery_rate) }}</p>
              </div>
              <div class="rounded-md border p-3">
                <p class="text-xs text-muted-foreground">Taxa de clique</p>
                <p class="mt-1 text-xl font-bold">{{ formatPercent(monitor.events.click_rate) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div class="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader class="flex flex-col gap-1">
              <CardTitle>Previsão de conclusão</CardTitle>
              <CardDescription>
                Projeção baseada na taxa real de envio.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-baseline justify-between">
                <span class="text-3xl font-bold">{{ formatPercent(forecast?.completed_percent) }}</span>
                <span class="text-sm text-muted-foreground">
                  {{ formatInteger(forecast?.sent) }} + {{ formatInteger(forecast?.failed) }} falhas de {{ formatInteger(forecast?.total_recipients) }}
                </span>
              </div>
              <Progress :model-value="forecast?.completed_percent ?? 0" />

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-md border p-3">
                  <p class="text-xs text-muted-foreground">Taxa real</p>
                  <p class="mt-1 text-lg font-bold">{{ formatRate(forecast?.rate_per_minute) }}</p>
                </div>
                <div class="rounded-md border p-3">
                  <p class="text-xs text-muted-foreground">Tempo restante</p>
                  <p class="mt-1 text-lg font-bold">{{ etaLabel }}</p>
                </div>
                <div class="rounded-md border p-3">
                  <p class="text-xs text-muted-foreground">Conclusão prevista</p>
                  <p class="mt-1 text-lg font-bold">{{ formatNullableDateTime(forecast?.estimate_complete_at) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Throughput por minuto</CardTitle>
                <CardDescription>
                  Eventos <span class="font-medium">sms.sent</span> e
                  <span class="font-medium">sms.delivered</span> por minuto (polling incremental).
                </CardDescription>
              </div>
              <Badge variant="outline">{{ throughputWindowLabel }}</Badge>
            </CardHeader>
            <CardContent>
              <apexchart v-if="throughputSeries[0].data.length" type="area" height="280" :options="throughputOptions" :series="throughputSeries" />
              <div
                v-else
                class="flex h-[280px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
              >
                Sem eventos no período
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Drill-down de execução</CardTitle>
            <CardDescription>
              Run → Wave → Batch → Recipient → Timeline individual.
            </CardDescription>
          </div>
          <Badge v-if="monitor.run" variant="outline">Run #{{ monitor.run.id }}</Badge>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="!monitor.run" class="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Sem execução ativa para esta campanha.
          </div>

          <template v-else>
            <div class="flex flex-wrap gap-4 text-sm">
              <div>
                <span class="text-xs text-muted-foreground">Iniciado em</span>
                <p class="font-medium">{{ formatNullableDateTime(monitor.run.started_at) }}</p>
              </div>
              <div>
                <span class="text-xs text-muted-foreground">Preparado em</span>
                <p class="font-medium">{{ formatNullableDateTime(monitor.run.prepared_at) }}</p>
              </div>
              <div>
                <span class="text-xs text-muted-foreground">Concluído em</span>
                <p class="font-medium">{{ formatNullableDateTime(monitor.run.finished_at) }}</p>
              </div>
              <div v-if="monitor.run.last_error">
                <span class="text-xs text-destructive">Último erro</span>
                <p class="max-w-md font-medium text-destructive">{{ monitor.run.last_error }}</p>
              </div>
            </div>

            <div v-for="wave in monitor.waves" :key="wave.id" class="rounded-lg border">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                @click="toggleWave(wave.id)"
              >
                <div class="flex items-center gap-2">
                  <ChevronRight
                    :class="['h-4 w-4 transition-transform', expandedWaveIds.has(wave.id) ? 'rotate-90' : '']"
                  />
                  <span class="font-medium">Wave #{{ wave.sequence }}</span>
                  <Badge :variant="statusVariant(wave.status)">{{ runStatusLabel(wave.status) }}</Badge>
                  <span class="text-xs text-muted-foreground">{{ wave.batches.length }} batches</span>
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ formatNullableDateTime(wave.scheduled_at) }}
                </span>
              </button>

              <div v-if="expandedWaveIds.has(wave.id)" class="space-y-2 border-t px-4 py-3">
                <div
                  v-for="batch in wave.batches"
                  :key="batch.id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-medium">Batch #{{ batch.sequence }}</span>
                    <Badge :variant="statusVariant(batch.status)">{{ runStatusLabel(batch.status) }}</Badge>
                    <span v-if="batch.attempts > 1" class="text-xs text-muted-foreground">
                      {{ batch.attempts }} tentativas
                    </span>
                    <span v-if="batch.last_error" class="text-xs text-destructive">{{ batch.last_error }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-muted-foreground">
                      {{ formatNullableDateTime(batch.finished_at) }}
                    </span>
                    <Button variant="outline" size="sm" :disabled="isRecipientsLoading" @click="loadRecipients(batch)">
                      <Users class="mr-2 h-3.5 w-3.5" />
                      Recipientes
                    </Button>
                  </div>
                </div>

                <div v-if="!wave.batches.length" class="py-2 text-center text-sm text-muted-foreground">
                  Nenhum batch nesta wave.
                </div>
              </div>
            </div>

            <div v-if="!monitor.waves.length" class="py-2 text-center text-sm text-muted-foreground">
              Nenhuma wave registrada.
            </div>
          </template>
        </CardContent>
      </Card>
    </template>

    <Card v-else>
      <CardContent class="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle class="h-8 w-8 text-muted-foreground" />
        <div>
          <p class="font-medium">Sem snapshot válido</p>
          <p class="text-sm text-muted-foreground">Selecione uma campanha para carregar o monitor.</p>
        </div>
      </CardContent>
    </Card>

    <Dialog :open="recipientsDialogOpen" @update:open="recipientsDialogOpen = $event">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recipientes do Batch #{{ selectedBatch?.sequence }}</DialogTitle>
          <DialogDescription>
            Identificados a partir dos eventos canônicos da campanha.
          </DialogDescription>
        </DialogHeader>

        <div v-if="isRecipientsLoading" class="space-y-2">
          <Skeleton v-for="item in 5" :key="item" class="h-10 w-full" />
        </div>

        <div v-else-if="recipientItems.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          Nenhum recipient identificado nos eventos desta campanha.
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Último evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in recipientItems" :key="item.recipientId">
              <TableCell class="font-medium">#{{ item.recipientId }}</TableCell>
              <TableCell>{{ formatDateTime(item.lastEvent.occurred_at) }}</TableCell>
              <TableCell>
                <Badge variant="outline">{{ item.lastEvent.event_type }}</Badge>
              </TableCell>
              <TableCell class="text-right">
                <Button variant="outline" size="sm" @click="openRecipientTimeline(item.recipientId)">
                  <History class="mr-2 h-3.5 w-3.5" />
                  Timeline
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>

    <Dialog :open="recipientTimelineOpen" @update:open="recipientTimelineOpen = $event">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Timeline do Recipient #{{ activeRecipientId }}</DialogTitle>
          <DialogDescription>
            Eventos canônicos do destinatário em ordem cronológica.
          </DialogDescription>
        </DialogHeader>

        <div v-if="recipientTimelineLoading" class="space-y-2">
          <Skeleton v-for="item in 4" :key="item" class="h-12 w-full" />
        </div>

        <Alert v-else-if="recipientTimelineError" variant="destructive">
          <AlertTitle>Erro ao carregar timeline</AlertTitle>
          <AlertDescription>{{ recipientTimelineError }}</AlertDescription>
        </Alert>

        <div v-else-if="recipientEvents.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          Nenhum evento para este recipient.
        </div>

        <div v-else class="space-y-4">
          <div v-for="event in recipientEvents" :key="event.event_id" class="flex items-start gap-3 rounded-lg border p-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <CircleDot class="h-4 w-4" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium">{{ event.event_type }}</span>
                <span class="text-xs text-muted-foreground">{{ formatDateTime(event.occurred_at) }}</span>
              </div>
              <pre
                v-if="event.data && Object.keys(event.data).length"
                class="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-[11px]"
                >{{ JSON.stringify(event.data, null, 2) }}</pre
              >
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ApexOptions } from "apexcharts";
import VueApexCharts from "vue3-apexcharts";
import {
  AlertTriangle,
  ChevronRight,
  CircleDot,
  History,
  Hourglass,
  RefreshCw,
  Send,
  Users,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listCampaigns } from "@/services/campaigns";
import type { CampaignListItem } from "@/contracts/campaigns";
import {
  getCampaignTimeline,
  getIncrementalEvents,
  getRecipientTimeline,
} from "@/services/observability";
import { useMonitorStore } from "@/stores/monitor";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import type { CanonicalEvent, CampaignBatch, CampaignForecast } from "@/contracts/observability";

const apexchart = VueApexCharts;
const monitorStore = useMonitorStore();
const workspaceStore = useWorkspaceStore();

const POLLING_INTERVAL_MS = 15_000;
const THROUGHPUT_WINDOW_MINUTES = 30;

const campaigns = ref<CampaignListItem[]>([]);
const selectedCampaignId = ref<string | undefined>(undefined);
const isRefreshing = ref(false);
const isInitialLoading = ref(false);
const errorMessage = ref("");
const lastUpdatedAt = ref<Date | null>(null);
const pollingId = ref<number | null>(null);
const incrementalCursor = ref<string | null>(null);
const throughputMap = ref<Map<number, { sent: number; delivered: number }>>(new Map());

const expandedWaveIds = ref<Set<number>>(new Set());
const recipientsDialogOpen = ref(false);
const selectedBatch = ref<CampaignBatch | null>(null);
const isRecipientsLoading = ref(false);
const recipientItems = ref<Array<{ recipientId: number; lastEvent: CanonicalEvent }>>([]);

const recipientTimelineOpen = ref(false);
const activeRecipientId = ref<number | null>(null);
const recipientTimelineLoading = ref(false);
const recipientTimelineError = ref("");
const recipientEvents = ref<CanonicalEvent[]>([]);

const monitor = computed(() => monitorStore.monitor);
const forecast = computed<CampaignForecast | null>(() => monitorStore.forecast);

const projectId = computed(() =>
  Number(workspaceStore.activeGroupProject?.project_id ?? 0),
);

const campaignId = computed(() => {
  const value = Number(selectedCampaignId.value);
  return Number.isFinite(value) && value > 0 ? value : null;
});

const failedCount = computed(() => {
  const counts = monitor.value?.run?.counts;
  const eventsFailed = monitor.value?.events["sms.failed"] ?? 0;
  return Math.max(counts?.failed ?? 0, eventsFailed);
});

const eventMetricItems = computed(() => {
  const events = monitor.value?.events;
  if (!events) return [];

  return [
    { key: "sms.queued", label: "Enfileirados", value: events["sms.queued"] },
    { key: "sms.sent", label: "Enviados", value: events["sms.sent"] },
    { key: "sms.delivered", label: "Entregues", value: events["sms.delivered"] },
    { key: "sms.failed", label: "Falhas", value: events["sms.failed"] },
    { key: "link.clicked", label: "Cliques", value: events["link.clicked"] },
  ] as Array<{ key: string; label: string; value: number }>;
});

const etaLabel = computed(() => {
  const eta = forecast.value?.eta_seconds;
  if (eta === null || eta === undefined || !Number.isFinite(eta)) return "—";

  const hours = Math.floor(eta / 3600);
  const minutes = Math.floor((eta % 3600) / 60);
  const seconds = Math.floor(eta % 60);

  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${seconds}s`;
  return `${seconds}s`;
});

const throughputSeries = computed(() => {
  const points = Array.from(throughputMap.value.entries())
    .map(([minuteKey, counts]) => ({
      minuteKey,
      sent: counts.sent,
      delivered: counts.delivered,
    }))
    .sort((a, b) => a.minuteKey - b.minuteKey);

  return [
    {
      name: "Enviados",
      data: points.map((point) => ({ x: point.minuteKey * 1000, y: point.sent })),
    },
    {
      name: "Entregues",
      data: points.map((point) => ({ x: point.minuteKey * 1000, y: point.delivered })),
    },
  ];
});

const throughputOptions = computed<ApexOptions>(() => ({
  chart: {
    animations: { enabled: false },
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  colors: ["#2563eb", "#059669"],
  dataLabels: { enabled: false },
  fill: {
    type: "gradient",
    gradient: {
      opacityFrom: 0.25,
      opacityTo: 0.04,
      stops: [0, 90, 100],
    },
  },
  grid: {
    borderColor: "hsl(var(--border))",
    strokeDashArray: 4,
  },
  legend: {
    labels: { colors: "hsl(var(--muted-foreground))" },
  },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  tooltip: {
    x: {
      formatter: (value) => formatDateTime(new Date(Number(value))),
    },
  },
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
      format: "HH:mm",
      rotate: 0,
      hideOverlappingLabels: true,
      trim: true,
      style: {
        colors: "hsl(var(--muted-foreground))",
        fontSize: "11px",
      },
    },
    tickAmount: 8,
    axisBorder: { color: "hsl(var(--border))" },
    axisTicks: { color: "hsl(var(--border))" },
  },
  yaxis: {
    labels: {
      formatter: (value) => formatInteger(Number(value)),
      style: {
        colors: "hsl(var(--muted-foreground))",
        fontSize: "11px",
      },
    },
    min: 0,
    forceNiceScale: true,
  },
}));

const throughputWindowLabel = computed(() => `Últimos ${THROUGHPUT_WINDOW_MINUTES} min`);

const integerFormatter = new Intl.NumberFormat("pt-BR");

function formatInteger(value: number | undefined | null) {
  return integerFormatter.format(Number.isFinite(value) ? Number(value) : 0);
}

function formatPercent(value: number | undefined | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${Number(value).toFixed(2).replace(".", ",")}%`;
}

function formatRate(value: number | undefined | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${Number(value).toFixed(1).replace(".", ",")}/min`;
}

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatNullableDateTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : "—";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    validating: "Validando",
    validation_failed: "Validação falhou",
    validated: "Validada",
    prepared: "Preparada",
    running: "Em execução",
    paused: "Pausada",
    completed: "Concluída",
    canceled: "Cancelada",
    archived: "Arquivada",
  };
  return labels[status] ?? status;
}

function runStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    preparing: "Preparando",
    running: "Executando",
    paused: "Pausado",
    completed: "Concluído",
    failed: "Falhou",
    canceled: "Cancelado",
  };
  return labels[status] ?? status;
}

function statusVariant(status: string) {
  if (["failed", "canceled", "validation_failed", "archived"].includes(status)) return "destructive";
  if (["paused", "preparing", "validating", "pending"].includes(status)) return "secondary";
  if (["completed"].includes(status)) return "default";
  return "outline";
}

async function loadCampaigns() {
  try {
    const filterId = workspaceStore.activeGroupProject?.id;
    const response = await listCampaigns({ filter_id: filterId, per_page: 100 });
    campaigns.value = response.data ?? [];
  } catch (error) {
    toast.error("Erro", { description: "Não foi possível carregar a lista de campanhas." });
  }
}

function onCampaignChange() {
  resetSnapshot();
  resetThroughput();
  refresh(true);
}

function resetSnapshot() {
  monitorStore.reset();
  lastUpdatedAt.value = null;
  errorMessage.value = "";
}

function resetThroughput() {
  throughputMap.value = new Map();
  incrementalCursor.value = null;
  expandedWaveIds.value = new Set();
}

async function refresh(force = false) {
  if (!campaignId.value || !projectId.value) return;

  if (isRefreshing.value && !force) return;
  isRefreshing.value = true;
  isInitialLoading.value = true;
  errorMessage.value = "";

  try {
    await monitorStore.fetchMonitor(campaignId.value, projectId.value, force);
    lastUpdatedAt.value = new Date();
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isRefreshing.value = false;
    isInitialLoading.value = false;
  }
}

async function pollIncremental() {
  if (!campaignId.value || !projectId.value) return;

  try {
    const response = await getIncrementalEvents({
      project_id: projectId.value,
      since: incrementalCursor.value ?? undefined,
      event_types: ["sms.sent", "sms.delivered"],
    });

    if (response.data.length) {
      accumulateThroughput(response.data);
      incrementalCursor.value = response.next_cursor;
    }
  } catch {
    // Silencia falhas do polling para não interromper o monitor principal.
  }
}

function accumulateThroughput(events: Array<{ event_type: string; occurred_at: string }>) {
  const now = Date.now();
  const cutoff = now - THROUGHPUT_WINDOW_MINUTES * 60_000;

  for (const event of events) {
    const timestamp = new Date(event.occurred_at).getTime();
    if (!Number.isFinite(timestamp) || timestamp < cutoff) continue;

    const minuteKey = Math.floor(timestamp / 60_000);
    const current = throughputMap.value.get(minuteKey) ?? { sent: 0, delivered: 0 };

    if (event.event_type === "sms.sent") current.sent += 1;
    if (event.event_type === "sms.delivered") current.delivered += 1;

    throughputMap.value.set(minuteKey, current);
  }

  const keys = Array.from(throughputMap.value.keys()).filter(
    (key) => key * 60_000 >= cutoff,
  );
  const next = new Map<number, { sent: number; delivered: number }>();
  keys.forEach((key) => next.set(key, throughputMap.value.get(key) as { sent: number; delivered: number }));
  throughputMap.value = next;
}

function toggleWave(waveId: number) {
  const next = new Set(expandedWaveIds.value);
  if (next.has(waveId)) next.delete(waveId);
  else next.add(waveId);
  expandedWaveIds.value = next;
}

async function loadRecipients(batch: CampaignBatch) {
  if (!campaignId.value || !projectId.value) return;

  selectedBatch.value = batch;
  recipientsDialogOpen.value = true;
  isRecipientsLoading.value = true;
  recipientItems.value = [];

  try {
    const response = await getCampaignTimeline(campaignId.value, projectId.value, { limit: 200 });
    const byRecipient = new Map<number, CanonicalEvent>();

    response.data.forEach((event) => {
      const recipientId = Number(event.references_data?.recipient_id ?? event.subject_id);
      if (!Number.isFinite(recipientId) || recipientId <= 0) return;

      const existing = byRecipient.get(recipientId);
      if (!existing || new Date(event.occurred_at) > new Date(existing.occurred_at)) {
        byRecipient.set(recipientId, event);
      }
    });

    recipientItems.value = Array.from(byRecipient.entries()).map(([recipientId, lastEvent]) => ({
      recipientId,
      lastEvent,
    }));
  } catch (error) {
    toast.error("Erro", { description: "Não foi possível carregar os recipients da campanha." });
  } finally {
    isRecipientsLoading.value = false;
  }
}

async function openRecipientTimeline(recipientId: number) {
  activeRecipientId.value = recipientId;
  recipientTimelineOpen.value = true;
  recipientTimelineLoading.value = true;
  recipientTimelineError.value = "";
  recipientEvents.value = [];

  try {
    const response = await getRecipientTimeline(recipientId, projectId.value, { limit: 50 });
    recipientEvents.value = response.data ?? [];
  } catch (error) {
    recipientTimelineError.value = extractErrorMessage(error);
  } finally {
    recipientTimelineLoading.value = false;
  }
}

function extractErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    if (response?.status === 403) return "Você não tem acesso a este projeto/workspace.";
    return response?.data?.message ?? "Não foi possível carregar os dados.";
  }
  return "Não foi possível carregar os dados.";
}

function startPolling() {
  stopPolling();
  pollingId.value = window.setInterval(() => {
    refresh();
    pollIncremental();
  }, POLLING_INTERVAL_MS);
}

function stopPolling() {
  if (pollingId.value) {
    window.clearInterval(pollingId.value);
    pollingId.value = null;
  }
}

onMounted(async () => {
  await loadCampaigns();
  startPolling();
  pollIncremental();
});

watch(
  () => workspaceStore.activeGroupProject?.id,
  async () => {
    selectedCampaignId.value = undefined;
    resetSnapshot();
    resetThroughput();
    await loadCampaigns();
  },
);

onBeforeUnmount(() => {
  stopPolling();
});

useScreenContext(
  "Monitor operacional de campanha",
  () => ({
    campaign_id: campaignId.value ?? "",
    campaign_status: monitor.value?.campaign_status ?? "",
    run_id: monitor.value?.run?.id ?? "",
    run_status: monitor.value?.run?.status ?? "",
    completed_percent: monitor.value?.forecast?.completed_percent ?? "",
    last_updated_at: lastUpdatedAt.value?.toISOString() ?? "",
  }),
  "/v1/campaigns/:campaign/monitor",
);
</script>
