<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Link Engine</h2>
        <p class="text-muted-foreground">
          Monitoramento operacional de cliques, fila, redirects e links degradados.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Badge v-if="lastUpdatedAt" variant="outline">
          Atualizado {{ formatDateTime(lastUpdatedAt) }}
        </Badge>
        <Button variant="outline" size="sm" :disabled="isFetching" @click="fetchMonitor(true)">
          <RefreshCw :class="['mr-2 h-4 w-4', isFetching ? 'animate-spin' : '']" />
          Atualizar
        </Button>
      </div>
    </div>

    <Alert v-if="hasFetchError" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Falha ao carregar monitoramento</AlertTitle>
      <AlertDescription class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span>{{ errorMessage }}</span>
        <Button variant="outline" size="sm" :disabled="isFetching" @click="fetchMonitor(true)">
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>

    <Alert v-if="monitor && monitor.redirect_errors['5xx'] > 0" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Degradacao em redirects</AlertTitle>
      <AlertDescription>
        Foram registrados {{ formatInteger(monitor.redirect_errors["5xx"]) }} erros 5xx nas ultimas 24h.
      </AlertDescription>
    </Alert>

    <Alert v-if="monitor && !hasExpectedChartPoints">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Serie temporal incompleta</AlertTitle>
      <AlertDescription>
        O endpoint retornou {{ formatInteger(monitor.clicks_per_minute_24h.length) }} pontos. O esperado e 1440 pontos.
      </AlertDescription>
    </Alert>

    <template v-if="isInitialLoading">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton v-for="item in 4" :key="item" class="h-32 w-full" />
      </div>
      <Skeleton class="h-[420px] w-full" />
      <Skeleton class="h-[320px] w-full" />
    </template>

    <template v-else-if="monitor">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Cliques em 5 min</CardTitle>
            <MousePointerClick class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatInteger(monitor.clicks_last_5min) }}</div>
            <p class="text-xs text-muted-foreground">Janela movel mais recente</p>
          </CardContent>
        </Card>

        <Card :class="queuePendingCritical ? 'border-destructive bg-destructive/5' : ''">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Fila pendente</CardTitle>
            <ListChecks class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div :class="['text-2xl font-bold', queuePendingCritical ? 'text-destructive' : '']">
              {{ formatInteger(monitor.queue_pending) }}
            </div>
            <p class="text-xs text-muted-foreground">Itens aguardando processamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Delay medio</CardTitle>
            <Clock3 class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatMilliseconds(monitor.avg_processing_delay_ms) }}</div>
            <p class="text-xs text-muted-foreground">Processamento da fila</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Amostras de redirect</CardTitle>
            <Gauge class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatInteger(monitor.redirect_latency.sample_size) }}</div>
            <p class="text-xs text-muted-foreground">Base dos percentis atuais</p>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        <Card class="lg:col-span-3">
          <CardHeader>
            <CardTitle>Latencia de redirect</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 md:grid-cols-3">
              <div v-for="item in latencyItems" :key="item.label" class="rounded-md border p-4">
                <p class="text-sm text-muted-foreground">{{ item.label }}</p>
                <p class="mt-2 text-2xl font-bold">{{ item.value }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle>Erros de redirect</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-md border p-4">
                <p class="text-sm text-muted-foreground">4xx nas ultimas 24h</p>
                <p class="mt-2 text-2xl font-bold">{{ formatInteger(monitor.redirect_errors["4xx"]) }}</p>
              </div>
              <div class="rounded-md border p-4">
                <p class="text-sm text-muted-foreground">5xx nas ultimas 24h</p>
                <p :class="['mt-2 text-2xl font-bold', monitor.redirect_errors['5xx'] > 0 ? 'text-destructive' : '']">
                  {{ formatInteger(monitor.redirect_errors["5xx"]) }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Cliques por minuto nas ultimas 24h</CardTitle>
            <p class="text-sm text-muted-foreground">
              {{ formatInteger(monitor.clicks_per_minute_24h.length) }} pontos retornados
            </p>
          </div>
          <Badge v-if="!hasExpectedChartPoints" variant="destructive">Esperado: 1440</Badge>
        </CardHeader>
        <CardContent>
          <apexchart
            v-if="chartSeries[0].data.length"
            type="area"
            height="360"
            :options="chartOptions"
            :series="chartSeries"
          />
          <div
            v-else
            class="flex h-[360px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
          >
            Sem dados no periodo
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Links com falha</CardTitle>
            <p class="text-sm text-muted-foreground">
              Destinos que retornaram timeout, erro ou indisponibilidade.
            </p>
          </div>
          <Badge :variant="monitor.unhealthy_links.length > 0 ? 'destructive' : 'outline'">
            {{ formatInteger(monitor.unhealthy_links.length) }} links
          </Badge>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead class="text-right">Checado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="link in monitor.unhealthy_links" :key="`${link.link_id}-${link.link_destination_id}`">
                  <TableCell class="font-medium">#{{ link.link_id }}</TableCell>
                  <TableCell>#{{ link.link_destination_id }}</TableCell>
                  <TableCell class="max-w-[320px] truncate" :title="link.url">
                    {{ link.url }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="isCriticalLinkStatus(link.status) ? 'destructive' : 'outline'">
                      {{ link.status || "—" }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ link.http_status ?? "—" }}</TableCell>
                  <TableCell>{{ formatMilliseconds(link.response_time_ms) }}</TableCell>
                  <TableCell class="max-w-[260px] truncate" :title="link.error_message || ''">
                    {{ link.error_message || "—" }}
                  </TableCell>
                  <TableCell class="text-right text-nowrap">
                    {{ formatNullableDateTime(link.checked_at) }}
                  </TableCell>
                </TableRow>
                <TableRow v-if="monitor.unhealthy_links.length === 0">
                  <TableCell :colspan="8" class="py-8 text-center text-muted-foreground">
                    Nenhum link degradado encontrado.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </template>

    <Card v-else>
      <CardContent class="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle class="h-8 w-8 text-muted-foreground" />
        <div>
          <p class="font-medium">Sem snapshot valido</p>
          <p class="text-sm text-muted-foreground">Nao foi possivel carregar o monitoramento.</p>
        </div>
        <Button :disabled="isFetching" @click="fetchMonitor(true)">Tentar novamente</Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ApexOptions } from "apexcharts";
import VueApexCharts from "vue3-apexcharts";
import {
  AlertTriangle,
  Clock3,
  Gauge,
  ListChecks,
  MousePointerClick,
  RefreshCw,
} from "lucide-vue-next";
import LinkEngineService from "@/services/linkEngine";
import type { LinkEngineMonitorResponse } from "@/services/linkEngine";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const apexchart = VueApexCharts;
const workspaceStore = useWorkspaceStore();

const POLLING_INTERVAL_MS = 30_000;
const EXPECTED_POINTS = 1440;

const monitor = ref<LinkEngineMonitorResponse | null>(null);
const isFetching = ref(false);
const hasFetchError = ref(false);
const errorMessage = ref("");
const lastUpdatedAt = ref<Date | null>(null);
const pollingId = ref<number | null>(null);

const integerFormatter = new Intl.NumberFormat("pt-BR");

const isInitialLoading = computed(() => isFetching.value && !monitor.value);
const queuePendingCritical = computed(() => (monitor.value?.queue_pending ?? 0) > 1000);
const hasExpectedChartPoints = computed(
  () => (monitor.value?.clicks_per_minute_24h.length ?? 0) === EXPECTED_POINTS,
);

const latencyItems = computed(() => {
  const latency = monitor.value?.redirect_latency;
  const noSamples = !latency || latency.sample_size === 0;

  return [
    { label: "p50", value: noSamples ? "Sem dados" : formatMilliseconds(latency.p50_ms) },
    { label: "p95", value: noSamples ? "Sem dados" : formatMilliseconds(latency.p95_ms) },
    { label: "p99", value: noSamples ? "Sem dados" : formatMilliseconds(latency.p99_ms) },
  ];
});

const chartSeries = computed(() => [
  {
    name: "Cliques",
    data: (monitor.value?.clicks_per_minute_24h ?? []).map((point) => ({
      x: new Date(point.minute).getTime(),
      y: point.clicks,
    })),
  },
]);

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    animations: { enabled: false },
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  colors: ["#2563eb"],
  dataLabels: { enabled: false },
  fill: {
    type: "gradient",
    gradient: {
      opacityFrom: 0.28,
      opacityTo: 0.04,
      stops: [0, 90, 100],
    },
  },
  grid: {
    borderColor: "hsl(var(--border))",
    strokeDashArray: 4,
  },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  tooltip: {
    x: {
      formatter: (value) => formatDateTime(new Date(value)),
    },
    y: {
      formatter: (value) => `${formatInteger(Number(value))} cliques`,
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
    tickAmount: 12,
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

function getRequestParams() {
  const filterId = workspaceStore.activeGroupProject?.id;

  return filterId ? { filter_id: filterId } : {};
}

function getRequestErrorMessage(error: any) {
  if (error?.response?.status === 403) {
    return "Voce nao tem permissao para acessar o monitoramento.";
  }

  if (!error?.response) {
    return "Nao foi possivel conectar ao servidor. O ultimo snapshot valido sera mantido quando existir.";
  }

  return "Nao foi possivel carregar os dados do Link Engine. O ultimo snapshot valido sera mantido quando existir.";
}

async function fetchMonitor(force = false) {
  if (isFetching.value && !force) {
    return;
  }

  isFetching.value = true;
  hasFetchError.value = false;

  try {
    monitor.value = await LinkEngineService.monitor(getRequestParams());
    lastUpdatedAt.value = new Date();
    errorMessage.value = "";
  } catch (error) {
    hasFetchError.value = true;
    errorMessage.value = getRequestErrorMessage(error);
  } finally {
    isFetching.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollingId.value = window.setInterval(() => fetchMonitor(), POLLING_INTERVAL_MS);
}

function stopPolling() {
  if (pollingId.value) {
    window.clearInterval(pollingId.value);
    pollingId.value = null;
  }
}

function formatInteger(value: number) {
  return integerFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatMilliseconds(value: number | null) {
  return value === null ? "—" : `${formatInteger(value)} ms`;
}

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatNullableDateTime(value: string | null) {
  return value ? formatDateTime(value) : "—";
}

function isCriticalLinkStatus(status: string) {
  return ["timeout", "error", "unreachable"].includes(status);
}

watch(
  () => workspaceStore.activeGroupProject?.id,
  () => fetchMonitor(true),
);

onMounted(() => {
  fetchMonitor(true);
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});

useScreenContext(
  "Monitoramento operacional do Link Engine",
  () => ({
    has_snapshot: Boolean(monitor.value),
    queue_pending: monitor.value?.queue_pending,
    unhealthy_links: monitor.value?.unhealthy_links.length,
    redirect_5xx: monitor.value?.redirect_errors["5xx"],
    last_updated_at: lastUpdatedAt.value?.toISOString(),
  }),
  "/v1/link-engine/monitor",
);
</script>
