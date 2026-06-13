<template>
  <section class="space-y-6">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
      <div class="space-y-0.5">
        <h2 class="text-xl font-bold tracking-tight">Dashboard Financeiro</h2>
        <p class="text-muted-foreground">
          Visão executiva dos resultados financeiros do período selecionado.
        </p>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Resultado Líquido</CardTitle>
        <CardDescription>Consolidado de entradas, saídas e saldo do período.</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="space-y-4">
          <Skeleton class="h-10 w-56" />
          <div class="grid gap-4 sm:grid-cols-2">
            <Skeleton class="h-16 w-full" />
            <Skeleton class="h-16 w-full" />
          </div>
        </div>

        <div v-else class="space-y-6">
          <p :class="['text-4xl font-bold tracking-tight', balanceClass]">
            {{ formatCurrency(dashboardData.consolidated.balance) }}
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-lg border bg-muted/30 p-4">
              <p class="text-sm text-muted-foreground">Entradas</p>
              <p class="mt-1 text-xl font-semibold text-emerald-600">
                {{ formatCurrency(dashboardData.consolidated.revenue) }}
              </p>
            </div>
            <div class="rounded-lg border bg-muted/30 p-4">
              <p class="text-sm text-muted-foreground">Saídas</p>
              <p class="mt-1 text-xl font-semibold text-red-500">
                {{ formatCurrency(dashboardData.consolidated.expense) }}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Setor</CardTitle>
          <CardDescription>Distribuição percentual das saídas por setor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="isLoading" class="h-80 w-full" />
          <div v-else-if="!sectorSeries.length" class="flex h-80 items-center justify-center text-sm text-muted-foreground">
            Nenhuma despesa por setor encontrada no período.
          </div>
          <apexchart
            v-else
            type="donut"
            height="400"
            :options="sectorChartOptions"
            :series="sectorSeries"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
          <CardDescription>Distribuição percentual das saídas por categoria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="isLoading" class="h-80 w-full" />
          <div v-else-if="!categorySeries.length" class="flex h-80 items-center justify-center text-sm text-muted-foreground">
            Nenhuma despesa por categoria encontrada no período.
          </div>
          <apexchart
            v-else
            type="donut"
            height="400"
            :options="categoryChartOptions"
            :series="categorySeries"
          />
        </CardContent>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { DateRange } from "radix-vue";
import VueApexCharts from "vue3-apexcharts";
import type { ApexOptions } from "apexcharts";
import financialTransactionsApi from "@/services/financialTransactions";
import { useWorkspaceStore } from "@/stores/workspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardChartItem {
  label: string;
  value: number;
  percentage: number;
}

interface DashboardResponse {
  period?: {
    start: string;
    end: string;
  };
  consolidated: {
    revenue: number;
    expense: number;
    balance: number;
    margin_percentage?: number;
    is_profitable: boolean;
  };
  charts: {
    expenses_by_sector: DashboardChartItem[];
    expenses_by_category: DashboardChartItem[];
  };
}

const apexchart = VueApexCharts;

const props = defineProps<{
  selectedRange: DateRange;
}>();

const activeGroupProjectId = useWorkspaceStore().activeGroupProject?.id ?? null;
const isLoading = ref(false);
const dashboardData = ref<DashboardResponse>({
  consolidated: {
    revenue: 0,
    expense: 0,
    balance: 0,
    is_profitable: true,
  },
  charts: {
    expenses_by_sector: [],
    expenses_by_category: [],
  },
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);

const formatDateForAPI = (date: DateRange["start"]) => {
  if (!date) return "";

  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
};

const buildChartOptions = (items: DashboardChartItem[]): ApexOptions => ({
  chart: {
    type: "donut",
    toolbar: { show: false },
    animations: { enabled: true },
  },
  labels: items.map((item) => item.label),
  colors: ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed", "#0891b2", "#ca8a04", "#db2777"],
  dataLabels: {
    enabled: true,
    formatter: (_value, options) => `${items[options.seriesIndex]?.percentage ?? 0}%`,
  },
  legend: {
    position: "bottom",
    formatter: (seriesName, options) => {
      const percentage = items[options.seriesIndex]?.percentage ?? 0;
      return `${seriesName} - ${percentage}%`;
    },
  },
  stroke: {
    width: 2,
    colors: ["#ffffff"],
  },
  tooltip: {
    y: {
      formatter: (value, options) => {
        const percentage = items[options.seriesIndex]?.percentage ?? 0;
        return `${formatCurrency(value)} (${percentage}%)`;
      },
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: "68%",
        labels: {
          show: true,
          value: {
            formatter: (value) => formatCurrency(Number(value)),
          },
          total: {
            show: true,
            label: "Total",
            formatter: () => formatCurrency(items.reduce((total, item) => total + item.value, 0)),
          },
        },
      },
    },
  },
});

const sectorSeries = computed(() => dashboardData.value.charts.expenses_by_sector.map((item) => item.value));
const categorySeries = computed(() => dashboardData.value.charts.expenses_by_category.map((item) => item.value));
const sectorChartOptions = computed(() => buildChartOptions(dashboardData.value.charts.expenses_by_sector));
const categoryChartOptions = computed(() => buildChartOptions(dashboardData.value.charts.expenses_by_category));
const balanceClass = computed(() => dashboardData.value.consolidated.is_profitable ? "text-emerald-600" : "text-red-500");

const fetchDashboard = async () => {
  if (!props.selectedRange.start || !props.selectedRange.end) return;

  isLoading.value = true;

  try {
    dashboardData.value = await financialTransactionsApi.dashboard({
      start_date: formatDateForAPI(props.selectedRange.start),
      end_date: formatDateForAPI(props.selectedRange.end),
      filter_id: activeGroupProjectId ? String(activeGroupProjectId) : null,
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard financeiro:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchDashboard);

watch(
  () => props.selectedRange,
  () => {
    fetchDashboard();
  },
  { deep: true },
);
</script>