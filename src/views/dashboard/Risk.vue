<script setup lang="ts">
import type { DateRange } from "radix-vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CalendarDate } from "@internationalized/date";
import { AlertCircle, Loader2 } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import RiskService from "@/services/risk";
import type { IndexResponse } from "@/services/risk";
import RiskHourlyChart from "@/components/risk/RiskHourlyChart.vue";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RiskChartValueType = "integer" | "money";

type RiskStatus = "idle" | "loading" | "refreshing" | "success" | "empty" | "error";

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const riskData = ref<IndexResponse | null>(null);
const status = ref<RiskStatus>("idle");
const errorMessage = ref("");
const validationMessage = ref("");
const draftFilters = ref({ start_date: "", end_date: "" });
const selectedRange = ref<DateRange>({ start: undefined, end: undefined });
const appliedFilters = ref({ start_date: "", end_date: "" });
const lastAppliedFilters = ref({ start_date: "", end_date: "" });
const currentController = ref<AbortController | null>(null);

const integerFormatter = new Intl.NumberFormat("pt-BR");

function getSaoPauloDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function formatDisplayDate(value: string) {
  if (!isValidDateString(value)) {
    return "";
  }

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

function dateStringToCalendarDate(value: string) {
  if (!isValidDateString(value)) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new CalendarDate(year, month, day);
}

function syncSelectedRange(filters: { start_date: string; end_date: string }) {
  selectedRange.value = {
    start: dateStringToCalendarDate(filters.start_date),
    end: dateStringToCalendarDate(filters.end_date),
  };
}

function updateDraftFiltersFromRange(range: DateRange) {
  if (range.start) {
    draftFilters.value.start_date = range.start.toString();
  }

  if (range.end) {
    draftFilters.value.end_date = range.end.toString();
  } else if (range.start) {
    draftFilters.value.end_date = range.start.toString();
  }
}

function normalizeQueryParam(value: unknown) {
  return typeof value === "string" && isValidDateString(value) ? value : "";
}

function getDefaultFilters() {
  const today = getSaoPauloDate();

  return { start_date: today, end_date: today };
}

function getInitialFilters() {
  const defaults = getDefaultFilters();
  const queryStartDate = normalizeQueryParam(route.query.start_date);
  const queryEndDate = normalizeQueryParam(route.query.end_date);

  return {
    start_date: queryStartDate || defaults.start_date,
    end_date: queryEndDate || defaults.end_date,
  };
}

function validateFilters(filters: { start_date: string; end_date: string }) {
  if (!filters.start_date || !isValidDateString(filters.start_date)) {
    return "Informe uma data inicial.";
  }

  if (!filters.end_date || !isValidDateString(filters.end_date)) {
    return "Informe uma data final valida.";
  }

  if (filters.end_date < filters.start_date) {
    return "A data final nao pode ser anterior a data inicial.";
  }

  return "";
}

function isCanceledError(error: any) {
  return error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
}

function getRequestErrorMessage(error: any) {
  if (error?.response?.status === 400) {
    return "Periodo invalido. Verifique as datas informadas.";
  }

  if (error?.response?.status === 403) {
    return "Filtro invalido ou voce nao tem permissao para acessar estes dados.";
  }

  if (!error?.response) {
    return "Nao foi possivel conectar ao servidor. Tente novamente.";
  }

  return "Nao foi possivel carregar os dados de risco.";
}

function chartIsEmpty(chart?: { series?: { data?: number[] }[] }) {
  return !chart?.series?.length || chart.series.every((serie) =>
    !serie.data?.length || serie.data.every((value) => Number(value) === 0),
  );
}

function getPayloadCharts(payload: IndexResponse) {
  return [
    payload.acquisition?.signups,
    payload.acquisition?.signups_accumulated,
    payload.engagement?.logins,
    payload.engagement?.unique_logins,
    payload.engagement?.unique_logins_accumulated,
    payload.monetization?.values?.deposits,
    payload.monetization?.values?.withdrawals,
    payload.monetization?.accumulated?.entries,
    payload.monetization?.accumulated?.withdrawals,
    payload.monetization?.quantities?.entries,
    payload.monetization?.quantities?.withdrawals,
  ];
}

function isEmptyPayload(payload: IndexResponse) {
  return getPayloadCharts(payload).every((chart) => chartIsEmpty(chart));
}

async function updateQuery(filters: { start_date: string; end_date: string }) {
  await router.replace({
    query: {
      ...route.query,
      start_date: filters.start_date,
      end_date: filters.end_date,
    },
  });
}

async function clearQuery() {
  const { start_date, end_date, ...query } = route.query;

  await router.replace({ query });
}

async function fetchRisk(filters: { start_date: string; end_date: string }) {
  validationMessage.value = "";

  const validation = validateFilters(filters);

  if (validation) {
    validationMessage.value = validation;
    return;
  }

  if (!workspaceStore.activeGroupProject?.id) {
    status.value = "error";
    errorMessage.value = "Selecione um grupo ou projeto antes de carregar os dados.";
    return;
  }

  currentController.value?.abort();
  currentController.value = new AbortController();
  status.value = riskData.value ? "refreshing" : "loading";
  errorMessage.value = "";
  appliedFilters.value = { ...filters };
  lastAppliedFilters.value = { ...filters };

  try {
    const response = await RiskService.index(
      {
        filter_id: workspaceStore.activeGroupProject.id,
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
      { signal: currentController.value.signal },
    );

    riskData.value = response;
    status.value = isEmptyPayload(response) ? "empty" : "success";
  } catch (error: any) {
    if (isCanceledError(error)) {
      return;
    }

    status.value = "error";
    errorMessage.value = getRequestErrorMessage(error);
  }
}

async function applyFilters() {
  const filters = { ...draftFilters.value };
  const validation = validateFilters(filters);

  if (validation) {
    validationMessage.value = validation;
    return;
  }

  await updateQuery(filters);
  await fetchRisk(filters);
}

async function clearFilters() {
  const defaults = getDefaultFilters();
  draftFilters.value = { ...defaults };
  syncSelectedRange(defaults);
  await clearQuery();
  await fetchRisk(defaults);
}

function retryLastRequest() {
  fetchRisk(lastAppliedFilters.value);
}

const isBusy = computed(() => status.value === "loading" || status.value === "refreshing");
const shouldShowSkeleton = computed(() => status.value === "loading" && !riskData.value);
const periodLabel = computed(() => {
  const startDate = formatDisplayDate(appliedFilters.value.start_date || draftFilters.value.start_date);
  const endDate = formatDisplayDate(appliedFilters.value.end_date || draftFilters.value.end_date);

  return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
});

const chartGroups = computed(() => [
  {
    title: "Aquisição",
    charts: [
      { data: riskData.value?.acquisition?.signups, type: "area" as const, valueType: "integer" as RiskChartValueType },
      { data: riskData.value?.acquisition?.signups_accumulated, type: "line" as const, valueType: "integer" as RiskChartValueType },
    ],
  },
  {
    title: "Engajamento",
    charts: [
      { data: riskData.value?.engagement?.logins, type: "area" as const, valueType: "integer" as RiskChartValueType },
      { data: riskData.value?.engagement?.unique_logins, type: "area" as const, valueType: "integer" as RiskChartValueType },
      { data: riskData.value?.engagement?.unique_logins_accumulated, type: "line" as const, valueType: "integer" as RiskChartValueType },
    ],
  },
  {
    title: "Monetização",
    charts: [
      { data: riskData.value?.monetization?.values?.deposits, type: "area" as const, valueType: "money" as RiskChartValueType },
      { data: riskData.value?.monetization?.values?.withdrawals, type: "area" as const, valueType: "money" as RiskChartValueType },
      { data: riskData.value?.monetization?.accumulated?.entries, type: "line" as const, valueType: "money" as RiskChartValueType },
      { data: riskData.value?.monetization?.accumulated?.withdrawals, type: "line" as const, valueType: "money" as RiskChartValueType },
      { data: riskData.value?.monetization?.quantities?.entries, type: "line" as const, valueType: "integer" as RiskChartValueType },
      { data: riskData.value?.monetization?.quantities?.withdrawals, type: "line" as const, valueType: "integer" as RiskChartValueType },
    ],
  },
]);

onMounted(() => {
  const initialFilters = getInitialFilters();
  draftFilters.value = { ...initialFilters };
  syncSelectedRange(initialFilters);
  appliedFilters.value = { ...initialFilters };
  lastAppliedFilters.value = { ...initialFilters };
  fetchRisk(initialFilters);
});

onBeforeUnmount(() => {
  currentController.value?.abort();
});

useScreenContext(
  "Tela de risco - Exibe indicadores operacionais por hora e monetizacao acumulada",
  () => ({
    start_date: appliedFilters.value.start_date,
    end_date: appliedFilters.value.end_date,
    filter_id: workspaceStore.activeGroupProject?.id || "",
  }),
  "/v1/risk",
);
</script>

<template>
  <div class="p-10 max-[450px]:p-0 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 pb-10">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-2xl font-bold tracking-tight">Risco</h2>
          <Badge v-if="periodLabel" variant="secondary">{{ periodLabel }}</Badge>
        </div>
        <p class="text-muted-foreground">
          Visao operacional por hora e indicadores acumulados do periodo.
        </p>
      </div>

      <div class="flex flex-col items-start justify-start gap-2 min-[900px]:items-end">
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <div class="grid w-full gap-1 sm:w-auto">
            <label class="text-xs font-medium text-muted-foreground">Periodo</label>
            <CustomDatePicker
              v-model="selectedRange"
              @update:model-value="updateDraftFiltersFromRange"
            />
          </div>
          <Button :disabled="isBusy" @click="applyFilters">
            <Loader2 v-if="isBusy" class="mr-2 h-4 w-4 animate-spin" />
            Aplicar Filtro
          </Button>
          <Button :disabled="isBusy" variant="outline" @click="clearFilters">Limpar</Button>
        </div>
        <p v-if="validationMessage" class="text-sm text-destructive">{{ validationMessage }}</p>
      </div>
    </div>

    <Alert v-if="status === 'error'" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Erro ao carregar dados</AlertTitle>
      <AlertDescription class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{{ errorMessage }}</span>
        <Button size="sm" variant="outline" :disabled="isBusy" @click="retryLastRequest">Tentar novamente</Button>
      </AlertDescription>
    </Alert>

    <Alert v-if="status === 'empty'" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Sem dados</AlertTitle>
      <AlertDescription>Sem dados no periodo selecionado.</AlertDescription>
    </Alert>

    <div v-if="shouldShowSkeleton" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton v-for="index in 6" :key="index" class="h-[420px]" />
    </div>

    <div v-else class="space-y-4" :class="{ 'opacity-60': status === 'refreshing' }">
      <Card v-for="group in chartGroups" :key="group.title">
        <CardHeader>
          <CardTitle>{{ group.title }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RiskHourlyChart
              v-for="chart in group.charts"
              :key="chart.data?.title"
              :type="chart.type"
              :title="chart.data?.title"
              :categories="chart.data?.x_axis || riskData?.hours || []"
              :series="chart.data?.series || []"
              :value-type="chart.valueType"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>