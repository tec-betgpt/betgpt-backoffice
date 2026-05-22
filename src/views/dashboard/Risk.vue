<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AlertCircle, Loader2 } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import RiskService from "@/services/risk";
import RiskHourlyChart from "@/components/risk/RiskHourlyChart.vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface RiskHourlyBucket {
  hour: string;
  count: number;
}

interface RiskPayload {
  acquisition: {
    signups_hourly: RiskHourlyBucket[];
    signups_total: number;
  };
  engagement: {
    logins_hourly: RiskHourlyBucket[];
    unique_logins_hourly: RiskHourlyBucket[];
    unique_logins_total: number;
  };
  monetization: {
    deposits_value: number;
    entries_accumulated_value: number;
    deposits_count: number;
    deposits_ticket_average: number;
    withdrawals_value: number;
    withdrawals_accumulated_value: number;
    withdrawals_count: number;
    withdrawals_ticket_average: number;
  };
  meta: Record<string, unknown>;
}

type RiskStatus = "idle" | "loading" | "refreshing" | "success" | "empty" | "error";

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const riskData = ref<RiskPayload | null>(null);
const status = ref<RiskStatus>("idle");
const errorMessage = ref("");
const validationMessage = ref("");
const draftFilters = ref({ start_date: "", end_date: "" });
const appliedFilters = ref({ start_date: "", end_date: "" });
const lastAppliedFilters = ref({ start_date: "", end_date: "" });
const currentController = ref<AbortController | null>(null);

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
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

function allSeriesAreEmpty(...series: RiskHourlyBucket[][]) {
  return series.every((serie) =>
    !serie?.length || serie.every((bucket) => Number(bucket.count) === 0),
  );
}

function isEmptyPayload(payload: RiskPayload) {
  const monetizationValues = Object.values(payload.monetization || {});

  return (
    Number(payload.acquisition?.signups_total) === 0 &&
    Number(payload.engagement?.unique_logins_total) === 0 &&
    monetizationValues.every((value) => Number(value) === 0) &&
    allSeriesAreEmpty(
      payload.acquisition?.signups_hourly || [],
      payload.engagement?.logins_hourly || [],
      payload.engagement?.unique_logins_hourly || [],
    )
  );
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
  await clearQuery();
  await fetchRisk(defaults);
}

function retryLastRequest() {
  fetchRisk(lastAppliedFilters.value);
}

const isBusy = computed(() => status.value === "loading" || status.value === "refreshing");
const shouldShowSkeleton = computed(() => status.value === "loading" && !riskData.value);
const isSingleDay = computed(() => appliedFilters.value.start_date === appliedFilters.value.end_date);
const periodLabel = computed(() => {
  const startDate = formatDisplayDate(appliedFilters.value.start_date || draftFilters.value.start_date);
  const endDate = formatDisplayDate(appliedFilters.value.end_date || draftFilters.value.end_date);

  return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
});

const acquisitionSeries = computed(() => [
  {
    name: "Cadastros",
    data: riskData.value?.acquisition?.signups_hourly || [],
  },
]);

const engagementSeries = computed(() => [
  {
    name: "Logins",
    data: riskData.value?.engagement?.logins_hourly || [],
  },
  {
    name: "Logins unicos",
    data: riskData.value?.engagement?.unique_logins_hourly || [],
  },
]);

const monetizationCards = computed(() => [
  { label: "Entradas pagas", value: riskData.value?.monetization?.deposits_value || 0, type: "money" },
  { label: "Entradas acumuladas", value: riskData.value?.monetization?.entries_accumulated_value || 0, type: "money" },
  { label: "Quantidade de entradas", value: riskData.value?.monetization?.deposits_count || 0, type: "integer" },
  { label: "Ticket medio de entradas", value: riskData.value?.monetization?.deposits_ticket_average || 0, type: "money" },
  { label: "Saidas pagas", value: riskData.value?.monetization?.withdrawals_value || 0, type: "money" },
  { label: "Saidas acumuladas", value: riskData.value?.monetization?.withdrawals_accumulated_value || 0, type: "money" },
  { label: "Quantidade de saidas", value: riskData.value?.monetization?.withdrawals_count || 0, type: "integer" },
  { label: "Ticket medio de saidas", value: riskData.value?.monetization?.withdrawals_ticket_average || 0, type: "money" },
]);

function formatCardValue(value: number, type: string) {
  return type === "money" ? moneyFormatter.format(Number(value) || 0) : integerFormatter.format(Number(value) || 0);
}

onMounted(() => {
  const initialFilters = getInitialFilters();
  draftFilters.value = { ...initialFilters };
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
          <div class="grid gap-1">
            <label class="text-xs font-medium text-muted-foreground" for="risk-start-date">Data inicial</label>
            <Input id="risk-start-date" v-model="draftFilters.start_date" type="date" class="sm:w-[160px]" />
          </div>
          <div class="grid gap-1">
            <label class="text-xs font-medium text-muted-foreground" for="risk-end-date">Data final</label>
            <Input id="risk-end-date" v-model="draftFilters.end_date" type="date" class="sm:w-[160px]" />
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
      <Skeleton class="h-[420px]" />
      <Skeleton class="h-[420px]" />
      <Skeleton class="h-[260px] lg:col-span-2" />
    </div>

    <div v-else class="space-y-4" :class="{ 'opacity-60': status === 'refreshing' }">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aquisição</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <p class="text-sm text-muted-foreground">Cadastros</p>
              <p class="text-3xl font-bold">{{ integerFormatter.format(riskData?.acquisition?.signups_total || 0) }}</p>
            </div>
            <RiskHourlyChart type="area" :series="acquisitionSeries" :is-single-day="isSingleDay" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engajamento</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <p class="text-sm text-muted-foreground">Logins unicos</p>
              <p class="text-3xl font-bold">{{ integerFormatter.format(riskData?.engagement?.unique_logins_total || 0) }}</p>
            </div>
            <RiskHourlyChart type="line" :series="engagementSeries" :is-single-day="isSingleDay" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monetização</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card v-for="card in monetizationCards" :key="card.label">
              <CardContent class="p-4">
                <p class="text-sm text-muted-foreground">{{ card.label }}</p>
                <p class="mt-2 text-2xl font-semibold">{{ formatCardValue(card.value, card.type) }}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>