<template>
  <div class="conversion-analytics-page space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Análise de Conversão</h2>
        <p class="text-muted-foreground">
          Relatórios de eventos de conversão e receita.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CustomDatePicker v-model="selectedRange" />
      </div>
    </div>

    <div class="grid gap-4 grid-cols-1">
      <ConversionPeriodComponent
          :is-loading="loading"
          title="Receita por canal"
          :period="revenuePeriod"
          type="currency"
      />
      <ConversionPeriodComponent
          :is-loading="loading"
          title="Eventos por canal"
          :period="eventsPeriod"
          type="numeric"
      />
    </div>

    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
      <ConversionPieChart :is-loading="loading" :chart-data="pieChartCounts" title="Contagem de Eventos de Conversão" />
      <ConversionPieChart :is-loading="loading" :chart-data="pieChartValues" title="Valor dos Eventos de Conversão" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { getLocalTimeZone, today } from "@internationalized/date";
import "moment/dist/locale/pt-br";
import ConversionAnalyticsService from "@/services/conversionAnalytics";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import ConversionPeriodComponent from "@/components/conversion_analytics/ConversionPeriodComponent.vue";
import ConversionPieChart from "@/components/conversion_analytics/ConversionPieChart.vue";

const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

const currentDate = today(getLocalTimeZone());
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({
  start: startDate,
  end: currentDate,
});

const loading = ref(true);
const lineChartData = ref({ series: [], dates: [] });
const pieChartCounts = ref({ series: [], labels: [] });
const pieChartValues = ref({ series: [], labels: [] });
const isFirstLoad = ref(true);

const formatDateForAPI = (date: any): string => {
  if (!date) return "";
  if (date && typeof date === "object" && "year" in date && "month" in date && "day" in date) {
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  }
  if (typeof date === "string") return date;
  return "";
};

const transformLineChartData = (series: any[], dates: any[], filter: string) => {
  const filteredSeries = series.filter(s => s.name.toLowerCase().includes(filter));
  if (filteredSeries.length === 0) return [];

  const chartData = dates.map((date, index) => {
    const dataPoint: any = { date };
    filteredSeries.forEach(s => {
      dataPoint[s.name] = s.data[index];
    });
    return dataPoint;
  });

  return filteredSeries.map(s => ({
    name: s.name,
    value: chartData,
  }));
};

const revenuePeriod = computed(() => {
  if (!lineChartData.value || !lineChartData.value.series) return [];
  return transformLineChartData(lineChartData.value.series, lineChartData.value.dates, 'revenue');
});

const eventsPeriod = computed(() => {
  if (!lineChartData.value || !lineChartData.value.series) return [];
  return transformLineChartData(lineChartData.value.series, lineChartData.value.dates, 'events');
});

const applyFilter = async () => {
  if (!workspaceStore.activeGroupProject?.id) {
    if (!isFirstLoad.value) {
      toast({
        title: "Erro",
        description: "Selecione um grupo ou projeto antes de filtrar.",
        variant: "destructive",
      });
    }
    return;
  }

  loading.value = true;

  try {
    const startDateFormatted = formatDateForAPI(selectedRange.value.start);
    const endDateFormatted = formatDateForAPI(selectedRange.value.end);

    const params: any = {
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      filter_id: workspaceStore.activeGroupProject.id,
    };

    const data = await ConversionAnalyticsService.index(params);

    lineChartData.value = data.line_chart || { series: [], dates: [] };
    pieChartCounts.value = data.pie_chart_counts || { series: [], labels: [] };
    pieChartValues.value = data.pie_chart_values || { series: [], labels: [] };

  } catch (error) {
    console.error("Erro ao carregar dados de análise de conversão:", error);
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível buscar os dados de análise de conversão.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
    isFirstLoad.value = false;
  }
};

watch(selectedRange, () => {
  if (!isFirstLoad.value) {
    applyFilter();
  }
}, { deep: true });

watch(() => workspaceStore.activeGroupProject, () => {
  applyFilter();
});

onMounted(() => {
  applyFilter();
});
</script>
