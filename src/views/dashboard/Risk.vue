<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Calendar as CalendarIcon, AlertCircle, Loader2 } from "lucide-vue-next";
import { CalendarDate } from "@internationalized/date";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import RiskService from "@/services/risk";
import type { IndexResponse, SmarticoChartData, SmarticoIndexResponse } from "@/services/risk";
import RiskHourlyChart from "@/components/risk/RiskHourlyChart.vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RiskChartValueType = "integer" | "money";

type RiskStatus = "idle" | "loading" | "refreshing" | "success" | "empty" | "error";
type RiskTab = "general" | "smartico";

type RiskFilters = {
  today_date: string;
  yesterday_date: string;
  average_start_date: string;
  average_end_date: string;
};

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const riskData = ref<IndexResponse | null>(null);
const smarticoData = ref<SmarticoIndexResponse | null>(null);
const activeTab = ref<RiskTab>("general");
const hasSmartico = ref(false);
const status = ref<RiskStatus>("idle");
const smarticoStatus = ref<RiskStatus>("idle");
const errorMessage = ref("");
const smarticoErrorMessage = ref("");
const validationMessage = ref("");
const draftFilters = ref<RiskFilters>({
  today_date: "",
  yesterday_date: "",
  average_start_date: "",
  average_end_date: "",
});
const appliedFilters = ref<RiskFilters>({
  today_date: "",
  yesterday_date: "",
  average_start_date: "",
  average_end_date: "",
});
const lastAppliedFilters = ref<RiskFilters>({
  today_date: "",
  yesterday_date: "",
  average_start_date: "",
  average_end_date: "",
});
const currentController = ref<AbortController | null>(null);
const smarticoController = ref<AbortController | null>(null);
const todayPopoverOpen = ref(false);
const yesterdayPopoverOpen = ref(false);
const averagePopoverOpen = ref(false);

const integerFormatter = new Intl.NumberFormat("pt-BR");
const averagePresetOptions = [7, 14, 30];

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

function formatShortDisplayDate(value: string) {
  if (!isValidDateString(value)) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);

  return formattedDate.replace(" de ", " ").replace(/\.$/, ".");
}

function dateStringToCalendarDate(value: string) {
  if (!isValidDateString(value)) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new CalendarDate(year, month, day);
}

function calendarDateToString(value?: CalendarDate) {
  return value?.toString() || "";
}

function getDateButtonLabel(label: string, value: string, expectedValue: string) {
  const formattedDate = formatDisplayDate(value);

  return value === expectedValue ? `${label}: ${formattedDate}` : formattedDate;
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeQueryParam(value: unknown) {
  return typeof value === "string" && isValidDateString(value) ? value : "";
}

function getDefaultFilters() {
  const today = getSaoPauloDate();
  const yesterday = addDays(today, -1);

  return {
    today_date: today,
    yesterday_date: yesterday,
    average_start_date: addDays(today, -6),
    average_end_date: today,
  };
}

function getInitialFilters() {
  const defaults = getDefaultFilters();

  return {
    today_date: normalizeQueryParam(route.query.today_date) || defaults.today_date,
    yesterday_date: normalizeQueryParam(route.query.yesterday_date) || defaults.yesterday_date,
    average_start_date: normalizeQueryParam(route.query.average_start_date) || defaults.average_start_date,
    average_end_date: normalizeQueryParam(route.query.average_end_date) || defaults.average_end_date,
  };
}

function validateFilters(filters: RiskFilters) {
  const maxDate = getSaoPauloDate();

  if (!filters.today_date || !isValidDateString(filters.today_date)) {
    return "Informe uma data valida para hoje.";
  }

  if (filters.today_date > maxDate) {
    return "A data de hoje nao pode ser futura.";
  }

  if (!filters.yesterday_date || !isValidDateString(filters.yesterday_date)) {
    return "Informe uma data valida para ontem.";
  }

  if (filters.yesterday_date > maxDate) {
    return "A data de ontem nao pode ser futura.";
  }

  if (!filters.average_start_date || !isValidDateString(filters.average_start_date)) {
    return "Informe uma data inicial valida para a media.";
  }

  if (filters.average_start_date > maxDate) {
    return "A data inicial da media nao pode ser futura.";
  }

  if (!filters.average_end_date || !isValidDateString(filters.average_end_date)) {
    return "Informe uma data final valida para a media.";
  }

  if (filters.average_end_date > maxDate) {
    return "A data final da media nao pode ser futura.";
  }

  if (filters.average_end_date < filters.average_start_date) {
    return "A data final da media nao pode ser anterior a data inicial.";
  }

  return "";
}

function getInclusiveDays(startDate: string, endDate: string) {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return 0;
  }

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

function getAverageSeriesLabel(filters: RiskFilters) {
  const days = getInclusiveDays(filters.average_start_date, filters.average_end_date);

  if (averagePresetOptions.includes(days)) {
    return `Media ${days} dias`;
  }

  const startDate = formatShortDisplayDate(filters.average_start_date);
  const endDate = formatShortDisplayDate(filters.average_end_date);

  return startDate && endDate ? `${startDate} ~ ${endDate}` : "Media";
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

function chartIsEmpty(chart?: { series?: { data?: (number | null)[] }[] }) {
  return !chart?.series?.length || chart.series.every((serie) =>
    !serie.data?.length || serie.data.every((value) => value === null || Number(value) === 0),
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

function getSmarticoCharts(payload?: SmarticoIndexResponse | null) {
  if (!payload?.available) {
    return [];
  }

  return [
    payload.casino?.revenue,
    payload.casino?.turnover,
    payload.casino?.ggr,
    payload.casino?.ggr_accumulated,
    payload.sports?.revenue,
    payload.sports?.turnover,
    payload.sports?.bets_count,
    payload.sports?.ggr,
    payload.bonus?.approved_amount,
    payload.bonus?.free_spins,
    payload.bonus?.free_spins_accumulated,
    payload.wallet?.real_balance,
    payload.wallet?.bonus_balance,
    payload.wallet?.total_balance,
  ].filter(Boolean);
}

function getSmarticoChartType(chart?: SmarticoChartData): "area" | "line" | "bar" {
  return chart?.chart_type === "line" ? "line" : "area";
}

function isEmptySmarticoPayload(payload: SmarticoIndexResponse) {
  return getSmarticoCharts(payload).every((chart) => chartIsEmpty(chart));
}

function getSmarticoChartValueType(chart?: SmarticoChartData): RiskChartValueType {
  return chart?.value_type === "integer" ? "integer" : "money";
}

async function updateQuery(filters: RiskFilters) {
  await router.replace({
    query: {
      ...route.query,
      today_date: filters.today_date,
      yesterday_date: filters.yesterday_date,
      average_start_date: filters.average_start_date,
      average_end_date: filters.average_end_date,
    },
  });
}

async function clearQuery() {
  const { today_date, yesterday_date, average_start_date, average_end_date, ...query } = route.query;

  await router.replace({ query });
}

async function fetchRisk(filters: RiskFilters) {
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
        today_date: filters.today_date,
        yesterday_date: filters.yesterday_date,
        average_start_date: filters.average_start_date,
        average_end_date: filters.average_end_date,
        filter_id: workspaceStore.activeGroupProject?.id,
      }
    );

    riskData.value = response;
    hasSmartico.value = Boolean(response.has_smartico);
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

  if (activeTab.value === "smartico" && hasSmartico.value) {
    await fetchSmartico(filters);
  }
}

async function clearFilters() {
  const defaults = getDefaultFilters();
  draftFilters.value = { ...defaults };
  await clearQuery();
  await fetchRisk(defaults);
}

function applyAveragePreset(days: number) {
  const endDate = draftFilters.value.average_end_date || getSaoPauloDate();
  draftFilters.value.average_start_date = addDays(endDate, -(days - 1));
  draftFilters.value.average_end_date = endDate;
}

function updateSingleDate(filter: "today_date" | "yesterday_date", value?: CalendarDate) {
  const date = calendarDateToString(value);

  if (date) {
    draftFilters.value[filter] = date;
  }
}

function updateAverageDate(filter: "average_start_date" | "average_end_date", value?: CalendarDate) {
  const date = calendarDateToString(value);

  if (date) {
    draftFilters.value[filter] = date;
  }
}

async function fetchSmartico(filters: RiskFilters = appliedFilters.value) {
  if (!workspaceStore.activeGroupProject?.id || !hasSmartico.value) {
    return;
  }

  smarticoController.value?.abort();
  smarticoController.value = new AbortController();
  smarticoStatus.value = smarticoData.value ? "refreshing" : "loading";
  smarticoErrorMessage.value = "";

  try {
    const response = await RiskService.smartico(
      {
        filter_id: workspaceStore.activeGroupProject.id,
        today_date: filters.today_date,
        yesterday_date: filters.yesterday_date,
        average_start_date: filters.average_start_date,
        average_end_date: filters.average_end_date,
      },
      { signal: smarticoController.value.signal },
    );

    smarticoData.value = response;
    smarticoStatus.value = isEmptySmarticoPayload(response) ? "empty" : "success";
  } catch (error: any) {
    if (isCanceledError(error)) {
      return;
    }

    smarticoStatus.value = "error";
    smarticoErrorMessage.value = getRequestErrorMessage(error);
  }
}

function handleTabChange(value: string | number) {
  activeTab.value = String(value) as RiskTab;
}

watch(activeTab, (tab) => {
  if (tab === "smartico" && hasSmartico.value && smarticoStatus.value === "idle") {
    void fetchSmartico();
  }
});

function retryLastRequest() {
  if (activeTab.value === "smartico") {
    fetchSmartico();
    return;
  }

  fetchRisk(lastAppliedFilters.value);
}

const isBusy = computed(() => status.value === "loading" || status.value === "refreshing");
const isSmarticoBusy = computed(() => smarticoStatus.value === "loading" || smarticoStatus.value === "refreshing");
const shouldShowSkeleton = computed(() => status.value === "loading" && !riskData.value);
const shouldShowSmarticoSkeleton = computed(() => activeTab.value === "smartico" && smarticoStatus.value === "loading" && !smarticoData.value);
const periodLabel = computed(() => {
  const filters = appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value;
  const todayDate = formatDisplayDate(filters.today_date);
  const yesterdayDate = formatDisplayDate(filters.yesterday_date);
  const averageStartDate = formatDisplayDate(filters.average_start_date);
  const averageEndDate = formatDisplayDate(filters.average_end_date);

  return `Hoje: ${todayDate} | Ontem: ${yesterdayDate} | Media: ${averageStartDate} - ${averageEndDate}`;
});
const seriesLabels = computed(() => ({
  today: formatDisplayDate(appliedFilters.value.today_date || draftFilters.value.today_date),
  yesterday: formatDisplayDate(appliedFilters.value.yesterday_date || draftFilters.value.yesterday_date),
  hoje: formatDisplayDate(appliedFilters.value.today_date || draftFilters.value.today_date),
  ontem: formatDisplayDate(appliedFilters.value.yesterday_date || draftFilters.value.yesterday_date),
  average: getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  media: getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  média: getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  "media 7 dias": getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  "média 7 dias": getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  "media 14 dias": getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  "média 14 dias": getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  "media 30 dias": getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
  "média 30 dias": getAverageSeriesLabel(appliedFilters.value.today_date ? appliedFilters.value : draftFilters.value),
}));
const todayCalendarValue = computed(() => dateStringToCalendarDate(draftFilters.value.today_date));
const yesterdayCalendarValue = computed(() => dateStringToCalendarDate(draftFilters.value.yesterday_date));
const averageStartCalendarValue = computed(() => dateStringToCalendarDate(draftFilters.value.average_start_date));
const averageEndCalendarValue = computed(() => dateStringToCalendarDate(draftFilters.value.average_end_date));
const maxCalendarValue = computed(() => dateStringToCalendarDate(getSaoPauloDate()));
const todayButtonLabel = computed(() =>
  getDateButtonLabel("Hoje", draftFilters.value.today_date, getSaoPauloDate()),
);
const yesterdayButtonLabel = computed(() =>
  getDateButtonLabel("Ontem", draftFilters.value.yesterday_date, addDays(getSaoPauloDate(), -1)),
);

const smarticoChartGroups = computed(() => [
  {
    title: "Indicadores Smartico",
    charts: [
      { data: smarticoData.value?.casino?.revenue, type: getSmarticoChartType(smarticoData.value?.casino?.revenue), valueType: getSmarticoChartValueType(smarticoData.value?.casino?.revenue) },
      { data: smarticoData.value?.casino?.ggr, type: getSmarticoChartType(smarticoData.value?.casino?.ggr), valueType: getSmarticoChartValueType(smarticoData.value?.casino?.ggr) },
      { data: smarticoData.value?.casino?.ggr_accumulated, type: getSmarticoChartType(smarticoData.value?.casino?.ggr_accumulated), valueType: getSmarticoChartValueType(smarticoData.value?.casino?.ggr_accumulated) },
      { data: smarticoData.value?.casino?.turnover, type: getSmarticoChartType(smarticoData.value?.casino?.turnover), valueType: getSmarticoChartValueType(smarticoData.value?.casino?.turnover) },
      { data: smarticoData.value?.sports?.bets_count, type: getSmarticoChartType(smarticoData.value?.sports?.bets_count), valueType: getSmarticoChartValueType(smarticoData.value?.sports?.bets_count) },
      { data: smarticoData.value?.bonus?.approved_amount, type: getSmarticoChartType(smarticoData.value?.bonus?.approved_amount), valueType: getSmarticoChartValueType(smarticoData.value?.bonus?.approved_amount) },
      { data: smarticoData.value?.bonus?.free_spins, type: getSmarticoChartType(smarticoData.value?.bonus?.free_spins), valueType: getSmarticoChartValueType(smarticoData.value?.bonus?.free_spins) },
      { data: smarticoData.value?.bonus?.free_spins_accumulated, type: getSmarticoChartType(smarticoData.value?.bonus?.free_spins_accumulated), valueType: getSmarticoChartValueType(smarticoData.value?.bonus?.free_spins_accumulated) },
      { data: smarticoData.value?.wallet?.total_balance, type: getSmarticoChartType(smarticoData.value?.wallet?.total_balance), valueType: getSmarticoChartValueType(smarticoData.value?.wallet?.total_balance) },
    ],
  },
]);

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
  appliedFilters.value = { ...initialFilters };
  lastAppliedFilters.value = { ...initialFilters };
  fetchRisk(initialFilters);
});

onBeforeUnmount(() => {
  currentController.value?.abort();
  smarticoController.value?.abort();
});

useScreenContext(
  "Tela de risco - Exibe indicadores operacionais por hora e monetizacao acumulada",
  () => ({
    today_date: appliedFilters.value.today_date,
    yesterday_date: appliedFilters.value.yesterday_date,
    average_start_date: appliedFilters.value.average_start_date,
    average_end_date: appliedFilters.value.average_end_date,
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
        <div class="grid w-full gap-3 sm:w-auto">
          <div class="flex flex-wrap items-center justify-start gap-2 min-[900px]:justify-end">
            <Popover v-model:open="todayPopoverOpen">
              <PopoverTrigger as-child>
                <Button type="button" variant="outline" :disabled="isBusy" class="justify-start gap-2">
                  <CalendarIcon class="h-4 w-4" />
                  {{ todayButtonLabel }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-3" align="end">
                <Calendar
                  :model-value="todayCalendarValue"
                  :max-value="maxCalendarValue"
                  weekday-format="short"
                  initial-focus
                  @update:model-value="updateSingleDate('today_date', $event); todayPopoverOpen = false"
                />
              </PopoverContent>
            </Popover>

            <Popover v-model:open="yesterdayPopoverOpen">
              <PopoverTrigger as-child>
                <Button type="button" variant="outline" :disabled="isBusy" class="justify-start gap-2">
                  <CalendarIcon class="h-4 w-4" />
                  {{ yesterdayButtonLabel }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-3" align="end">
                <Calendar
                  :model-value="yesterdayCalendarValue"
                  :max-value="maxCalendarValue"
                  weekday-format="short"
                  initial-focus
                  @update:model-value="updateSingleDate('yesterday_date', $event); yesterdayPopoverOpen = false"
                />
              </PopoverContent>
            </Popover>

            <Popover v-model:open="averagePopoverOpen">
              <PopoverTrigger as-child>
                <Button type="button" variant="outline" :disabled="isBusy" class="justify-start gap-2">
                  <CalendarIcon class="h-4 w-4" />
                  Media: {{ formatDisplayDate(draftFilters.average_start_date) }} - {{ formatDisplayDate(draftFilters.average_end_date) }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto max-w-[calc(100vw-2rem)] p-4" align="end">
                <div class="grid gap-4 lg:grid-cols-[auto_auto]">
                  <div class="grid gap-2">
                    <span class="text-xs font-medium text-muted-foreground">Media inicial</span>
                    <Calendar
                      :model-value="averageStartCalendarValue"
                      :max-value="maxCalendarValue"
                      weekday-format="short"
                      initial-focus
                      @update:model-value="updateAverageDate('average_start_date', $event)"
                    />
                  </div>
                  <div class="grid gap-2">
                    <span class="text-xs font-medium text-muted-foreground">Media final</span>
                    <Calendar
                      :model-value="averageEndCalendarValue"
                      :max-value="maxCalendarValue"
                      weekday-format="short"
                      @update:model-value="updateAverageDate('average_end_date', $event)"
                    />
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                  <span class="text-xs font-medium text-muted-foreground">Predefinicoes:</span>
                  <Button
                    v-for="days in averagePresetOptions"
                    :key="days"
                    type="button"
                    size="sm"
                    variant="outline"
                    :disabled="isBusy"
                    @click="applyAveragePreset(days)"
                  >
                    Ultimos {{ days }} dias
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div class="flex flex-wrap items-center justify-start gap-2 min-[900px]:justify-end">
            <Button :disabled="isBusy" @click="applyFilters">
              <Loader2 v-if="isBusy" class="mr-2 h-4 w-4 animate-spin" />
              Aplicar Filtro
            </Button>
            <Button :disabled="isBusy" variant="outline" @click="clearFilters">Limpar</Button>
          </div>
        </div>
        <p v-if="validationMessage" class="text-sm text-destructive">{{ validationMessage }}</p>
      </div>
    </div>

    <Tabs
      v-if="hasSmartico"
      :model-value="activeTab"
      class="mb-4"
      @update:model-value="handleTabChange"
    >
      <TabsList>
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="smartico">Smartico</TabsTrigger>
      </TabsList>
    </Tabs>

    <div v-show="!hasSmartico || activeTab === 'general'" class="space-y-4">
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

      <div v-else-if="riskData" class="space-y-4" :class="{ 'opacity-60': status === 'refreshing' }">
        <Card v-for="group in chartGroups" :key="group.title">
          <CardHeader>
            <CardTitle>{{ group.title }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RiskHourlyChart
                v-for="chart in group.charts"
                :key="`${chart.data?.title}-${appliedFilters.today_date}`"
                :type="chart.type"
                :title="chart.data?.title"
                :categories="chart.data?.x_axis || riskData?.hours || []"
                :series="chart.data?.series || []"
                :series-labels="seriesLabels"
                :value-type="chart.valueType"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div v-show="hasSmartico && activeTab === 'smartico'" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Fonte: Smartico (snapshots horários)</Badge>
        <Badge v-if="smarticoData?.meta?.last_sync_at" variant="secondary">
          Última sync: {{ smarticoData.meta.last_sync_at }}
        </Badge>
      </div>

      <Alert v-if="smarticoStatus === 'error'" variant="destructive" class="mb-4">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Erro ao carregar dados Smartico</AlertTitle>
        <AlertDescription class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ smarticoErrorMessage }}</span>
          <Button size="sm" variant="outline" :disabled="isSmarticoBusy" @click="retryLastRequest">Tentar novamente</Button>
        </AlertDescription>
      </Alert>

      <Alert v-if="smarticoStatus === 'empty'" class="mb-4">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Sem dados</AlertTitle>
        <AlertDescription>
          Ainda não há snapshots horários para este período. Os dados são sincronizados automaticamente a cada hora
          (job <code>smartico:sync-hourly</code>).
        </AlertDescription>
      </Alert>

      <div v-if="shouldShowSmarticoSkeleton" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton v-for="index in 6" :key="`smartico-${index}`" class="h-[420px]" />
      </div>

      <div v-else-if="smarticoData?.available" class="space-y-4" :class="{ 'opacity-60': smarticoStatus === 'refreshing' }">
        <Card v-for="group in smarticoChartGroups" :key="group.title">
          <CardHeader>
            <CardTitle>{{ group.title }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <RiskHourlyChart
                  v-for="chart in group.charts"
                  :key="`${chart.data?.title}-${appliedFilters.today_date}`"
                  :type="chart.type"
                  :title="chart.data?.title"
                  :categories="chart.data?.x_axis || smarticoData?.hours || []"
                  :series="chart.data?.series || []"
                  :series-labels="seriesLabels"
                  :value-type="chart.valueType"
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>