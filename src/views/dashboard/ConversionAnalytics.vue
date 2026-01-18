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

    <div class="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="h-8 w-3/4 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
          <div v-else>
            <p class="text-2xl font-bold">{{ currencyFilter(averageTicket) }}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Receita (Elevate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="h-8 w-3/4 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
          <div v-else>
            <p class="text-2xl font-bold">{{ currencyFilter(periodTotals.elevate?.total_value || 0) }}</p>
            <p class="text-xs text-muted-foreground">{{ periodTotals.elevate?.conversion_count || 0 }} conversões</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Receita (Outros)</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="h-8 w-3/4 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
          <div v-else>
            <p class="text-2xl font-bold">{{ currencyFilter(periodTotals.others?.total_value || 0) }}</p>
            <p class="text-xs text-muted-foreground">{{ periodTotals.others?.conversion_count || 0 }} conversões</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 grid-cols-1">
       <TrafficAcquisitionTable
          title="Performance por Canal"
          :loading="loading"
          :data="channelPerformanceData"
          :grand-total="null"
          :page-total="null"
          :pages="{ current: 1, last: 1, total: channelPerformanceData.length }"
          :per-pages="100"
          :columns="columns"
          :column-visibility="columnVisibility"
          :order-id="orderId"
          :order="order"
          :search-values="searchValues"
          @apply-filter="applyFilter"
          @update:column-visibility="columnVisibility = $event"
          @update:search-values="searchValues = $event"
          @update:per-pages="perPages = $event"
      >
        <template #filters>
          <div class="grid w-full max-w-sm md:max-w-64 items-center gap-1.5">
            <Label for="input-channel-group">Grupo de Canais</Label>
            <Select v-model="searchValues['channel_group']">
              <SelectTrigger class="sm:max-w-sm md:max-w-64 w-full">
                <SelectValue placeholder="Selecione o grupo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(channelGroup,index) in channelGroups" :key="index" :value="channelGroup">{{channelGroup}}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button class="mt-0 lg:mt-6" @click="applyFilter()" :disabled="loading">
            <Search />
          </Button>
        </template>
        <template #body-cell-totalRevenue="{ row }">
          {{ currencyFilter(row.totalRevenue) }}
        </template>
        <template #body-cell-variation="{ row }">
           <Badge v-if="row.variation > 0" class="bg-green-200 text-green-600 h-4 px-1 mr-2">
              <ArrowUp class="w-3 mr-2" /> {{ Math.abs(row.variation || 0).toFixed(1) }}%
            </Badge>
            <Badge v-if="row.variation < 0" class="bg-red-200 text-red-600 h-4 px-1 mr-2">
              <ArrowDown class="w-3 mr-2" /> {{ Math.abs(row.variation || 0).toFixed(1) }}%
            </Badge>
        </template>
      </TrafficAcquisitionTable>
    </div>
    
    <div class="grid gap-4 grid-cols-1">
      <ConversionPeriodComponent
          :is-loading="loading"
          title="Receita por canal"
          :period="revenuePeriod"
          type="currency"
          glossary="Dados de receita registrada"
      />
      <PeriodComponent
          :is-loading="loading"
          title="Eventos por canal"
          :period="eventsPeriod"
          type="numeric"
      />
    </div>

    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
      <ConversionDefinitionPieChart :is-loading="loading" :chart-data="pieChartCounts" title="Contagem de Eventos de Conversão" type="numeric" />
      <ConversionDefinitionPieChart :is-loading="loading" :chart-data="pieChartValues" title="Valor dos Eventos de Conversão" type="currency"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { getLocalTimeZone, today } from "@internationalized/date";
import "moment/dist/locale/pt-br";
import ConversionAnalyticsService from "@/services/conversionAnalytics";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";
import ConversionPeriodComponent from "@/components/conversion_analytics/ConversionPeriodComponent.vue";
import TrafficAcquisitionTable from "@/components/custom/TrafficAcquisitionTable.vue";
import ConversionDefinitionPieChart from "@/components/conversion_analytics/ConversionDefinitionPieChart.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import currencyFilter from "@/filters/currencyFilter";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowDown, ArrowUp } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";

const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

const currentDate = today(getLocalTimeZone());
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({
  start: startDate,
  end: currentDate,
});

const loading = ref(true);
const pieChartCounts = ref({ series: [], labels: [] });
const pieChartValues = ref({ series: [], labels: [] });
const isFirstLoad = ref(true);
const revenuePeriod = ref<{ name: string; value: any[] }[]>([]);
const eventsPeriod = ref<{ name: string; value: any[] }[]>([]);
const averageTicket = ref(0);
const periodTotals = ref({ elevate: null, others: null });
const channelPerformanceData = ref<any[]>([]);
const orderId = ref('totalRevenue');
const order = ref(false);
const perPages = ref(100);
const channelGroups = ref([])
const searchValues = ref<Record<string, string>>({
  channel_group: 'Elevate'
});

const columns = ref([
  { id: 'channel', label: 'Canal', tooltip: 'Nome do Canal' },
  { id: 'eventCount', label: 'Contagem de Eventos', tooltip: 'Número de eventos de conversão.' },
  { id: 'totalRevenue', label: 'Receita Total', tooltip: 'Soma da receita.' },
  { id: 'variation', label: 'Variação', tooltip: 'Variação percentual da receita.' },
]);

const columnVisibility = ref<Record<string, boolean>>({
  channel: true,
  eventCount: true,
  totalRevenue: true,
  variation: true,
});



const formatDateForAPI = (date: any): string => {
  if (!date) return "";

  if (
      date &&
      typeof date === "object" &&
      "year" in date &&
      "month" in date &&
      "day" in date
  ) {
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(
        date.day
    ).padStart(2, "0")}`;
  }

  if (typeof date === "string") {
    return date;
  }

  return "";
};



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
    const endDateFormatted =formatDateForAPI(selectedRange.value.end);

    const params: any = {
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      filter_id: workspaceStore.activeGroupProject.id,
      ...searchValues.value
    };

    const data = await ConversionAnalyticsService.index(params);
    revenuePeriod.value = [{name:"Receita Total",value:data.data_by_period}]
    eventsPeriod.value = [{name:"Eventos",value:data.data_by_event}]
    pieChartCounts.value = data.pie_chart_counts
    pieChartValues.value = data.pie_chart_values
    averageTicket.value = data.average_ticket
    periodTotals.value = data.period_totals
    channelPerformanceData.value = data.channel_performance
    channelGroups.value = data.channel_groups
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
