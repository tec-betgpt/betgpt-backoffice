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

    <FinancialDonutCharts
      :sector="dashboardData.charts.expenses_by_sector"
      :category="dashboardData.charts.expenses_by_category"
      :is-loading="isLoading"
      empty-label="Nenhuma despesa encontrada no período."
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { DateRange } from "reka-ui";
import financialTransactionsApi from "@/services/financialTransactions";
import { useWorkspaceStore } from "@/stores/workspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FinancialDonutCharts from "@/components/financial/FinancialDonutCharts.vue";

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