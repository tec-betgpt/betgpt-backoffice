<script setup lang="ts">
import {ref, watch, onMounted, computed} from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import Analytics from "@/services/analytics";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import { formatMinifiedNumber, numberLocale } from "@/filters/formatNumbers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import RetentionBarLineChart from "@/components/ui/chart-bar/RetentionBarLineChart.vue";
import VueApexCharts from "vue3-apexcharts";

const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

const selectedRange = ref({ start: null, end: null });
const isLoading = ref(true);
const retentionData = ref<any[]>([]);

const chartRetentionData = computed(() =>
  retentionData.value.map((row) => ({
    date: row.date,
    'Novos Clientes': Number(row['Novos Clientes']) || 0,
    'Novos Clientes D0': Number(row['Novos Clientes D0']) || 0,
    'Novos Clientes Pós D0': Number(row['Novos Clientes Pós D0']) || 0,
    'Clientes Recuperados': Number(row['Clientes Recuperados']) || 0,
    'Clientes Retidos': Number(row['Clientes Retidos']) || 0,
    Churn: Number(row['Churn']) || 0,
    'Total Ativos': Number(row['Total Ativos']) || 0,
  })),
);

const totals = computed(() => {
  const sum = {
    "Novos Clientes": 0,
    "Clientes Recuperados": 0,
    "Clientes Retidos": 0,
    "Churn": 0,
  };

  retentionData.value.forEach((row) => {
    sum["Novos Clientes"] += Number(row["Novos Clientes"]) || 0;
    sum["Clientes Recuperados"] += Number(row["Clientes Recuperados"]) || 0;
    sum["Clientes Retidos"] += Number(row["Clientes Retidos"]) || 0;
    sum["Churn"] += Number(row["Churn"]) || 0;
  });

  return sum;
});

const donutOptions = computed(() => ({
  chart: {
    type: 'donut',
    background: 'transparent',
    toolbar: { show: false }
  },
  labels: ['Novos Clientes', 'Clientes Recuperados', 'Clientes Retidos', 'Churn'],
  colors: ['#f4a261', '#2a9d8f', '#457b9d', '#e63946'],
  legend: {
    position: 'bottom'
  },
  stroke: {
    show: false
  },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
        return formatMinifiedNumber(opts.w.globals.series[opts.seriesIndex]);
    }
  },
  tooltip: {
    y: {
      formatter: (val) => numberLocale(val)
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
            show: true,
            total: {
                show: true,
                label: 'Total Ativos',
                formatter: (w) => {
                    const totalAtivos = w.globals.series[0] + w.globals.series[1] + w.globals.series[2];
                    return formatMinifiedNumber(totalAtivos);
                }
            }
        }
      }
    }
  }
}));

const donutSeries = computed(() => [
  totals.value['Novos Clientes'],
  totals.value['Clientes Recuperados'],
  totals.value['Clientes Retidos'],
  totals.value['Churn'],
]);

/** Nenhuma linha no gráfico só-barras (evita `line-categories="[]"` virar string no template). */
const retentionBarOnlyLineCategories: string[] = [];

const applyFilter = async () => {
  isLoading.value = true;

  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });

    isLoading.value = false;
    return;
  }

  try {
    const { data } = await Analytics.clientClassification({
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,
    });

    retentionData.value = data.client_classification_period || [];
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

watch(selectedRange, () => {
  applyFilter();
}, { deep: true });

onMounted(() => {
    if (workspaceStore.activeGroupProject?.id) {
        applyFilter();
    }
});
</script>

<template>
  <div class="google-analytics-page p-10 max-[450px]:p-0 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 pb-10">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Análise de Retenção</h2>
        <p class="text-muted-foreground">
          Classificação de players com base em seus depósitos e atividade.
        </p>
      </div>
      <div class="flex items-center justify-start w-full">
        <div class="flex flex-col items-center justify-end sm:flex-row gap-2 w-full">
          <CustomDatePicker v-model="selectedRange" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4">
      <Card v-if="isLoading">
        <CardHeader>
          <Skeleton class="h-6 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton class="h-80 w-full" />
        </CardContent>
      </Card>

      <Card v-else>
        <CardHeader class="py-4">
          <div class="flex justify-between items-center align-middle">
            <CardTitle>Composição de Clientes Ativos</CardTitle>
            <div class="flex items-center gap-2">
               <GlossaryTooltipComponent description="Visão mensal da composição de clientes ativos (Novos + Recuperados + Retidos) e métricas de perda." />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent class="pt-6">
           <RetentionBarLineChart
            :data="chartRetentionData"
            index="date"
            :categories="[
              'Novos Clientes',
              'Novos Clientes D0',
              'Novos Clientes Pós D0',
              'Clientes Recuperados',
              'Clientes Retidos',
              'Churn',
              'Total Ativos',
            ]"
            :bar-categories="['Novos Clientes', 'Clientes Recuperados', 'Clientes Retidos']"
            :line-categories="['Churn', 'Total Ativos']"
            :colors="['#f4a261', '#e9c46a', '#dda15e', '#2a9d8f', '#457b9d', '#e63946', '#1d3557']"
            :show-legend="true"
            lines-only
          />

          <Separator class="my-8" />
          <h3 class="text-sm font-semibold text-foreground mb-4">
            Clientes por Atividades
          </h3>
          <RetentionBarLineChart
            class="md:h-[380px]"
            :data="chartRetentionData"
            index="date"
            :categories="['Novos Clientes', 'Clientes Recuperados', 'Clientes Retidos']"
            :bar-categories="['Novos Clientes', 'Clientes Recuperados', 'Clientes Retidos']"
            :line-categories="[]"
            :colors="['#f4a261', '#2a9d8f', '#457b9d']"
            :show-legend="true"
          />

          <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div class="flex items-start gap-2">
                  <div class="mt-1 min-w-3 h-3 rounded-full" style="background-color: #f4a261"></div>
                  <span><strong>Novos Clientes:</strong> data do primeiro depósito (FTD) na janela móvel de 30 dias do relatório.</span>
              </div>
              <div class="flex items-start gap-2">
                  <div class="mt-1 min-w-3 h-3 rounded-full" style="background-color: #e9c46a"></div>
                  <span><strong>Novos Clientes D0:</strong> FTD no mesmo dia do cadastro no projeto.</span>
              </div>
              <div class="flex items-start gap-2">
                  <div class="mt-1 min-w-3 h-3 rounded-full" style="background-color: #dda15e"></div>
                  <span><strong>Novos Clientes Pós D0:</strong> FTD em dia posterior ao cadastro do perfil no projeto.</span>
              </div>
              <div class="flex items-start gap-2">
                  <div class="mt-1 min-w-3 h-3 rounded-full" style="background-color: #2a9d8f"></div>
                  <span><strong>Clientes Recuperados:</strong> Voltaram a depositar após um mês ou mais.</span>
              </div>
              <div class="flex items-start gap-2">
                  <div class="mt-1 min-w-3 h-3 rounded-full" style="background-color: #457b9d"></div>
                  <span><strong>Clientes Retidos:</strong> Mantiveram depósitos no mês atual e anterior.</span>
              </div>
              <div class="flex items-start gap-2">
                  <div class="mt-1 min-w-3 h-3 rounded-full" style="background-color: #e63946"></div>
                  <span><strong>Churn:</strong> Deixaram de depositar no mês atual, mas depositaram no anterior.</span>
              </div>
              <div class="flex items-start gap-2">
                  <div class="mt-1 min-w-3 h-3 rounded-full" style="background-color: #1d3557"></div>
                  <span><strong>Total Ativos:</strong> Jogadores com depósito no mês atual (Novos + Recuperados + Retidos).</span>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4" v-if="!isLoading && retentionData.length > 0">
      <Card>
        <CardHeader class="py-4">
          <CardTitle>Composição do Período</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent class="pt-6 flex justify-center items-center h-[350px]">
          <VueApexCharts
              type="donut"
              width="100%"
              height="300"
              :options="donutOptions"
              :series="donutSeries"
          />
        </CardContent>
      </Card>

      <Card class="lg:col-span-2 overflow-hidden flex flex-col">
        <CardHeader class="py-4 shrink-0">
          <CardTitle>Detalhamento Diário</CardTitle>
        </CardHeader>
        <Separator class="shrink-0" />
        <CardContent class="p-0 flex-1 max-h-[350px]">
          <div class="overflow-x-auto overflow-y-auto h-full p-6 pt-0 custom-scrollbar">
            <Table>
              <TableHeader class="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead class="font-bold text-nowrap">Data</TableHead>
                  <TableHead class="text-right font-bold text-nowrap">Total Ativos</TableHead>
                  <TableHead class="text-right font-bold text-[#f4a261] text-nowrap">Novos</TableHead>
                  <TableHead class="text-right font-bold text-[#e9c46a] text-nowrap">Novos D0</TableHead>
                  <TableHead class="text-right font-bold text-[#dda15e] text-nowrap">Novos Pós D0</TableHead>
                  <TableHead class="text-right font-bold text-[#2a9d8f] text-nowrap">Recuperados</TableHead>
                  <TableHead class="text-right font-bold text-[#457b9d] text-nowrap">Retidos</TableHead>
                  <TableHead class="text-right font-bold text-[#e63946] text-nowrap">Churn</TableHead>
                  <TableHead class="text-right font-bold text-[#22577a] text-nowrap">Inativos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, index) in retentionData" :key="index">
                  <TableCell class="font-medium text-nowrap">{{ row.date }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Total Ativos']) }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Novos Clientes']) }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Novos Clientes D0']) }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Novos Clientes Pós D0']) }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Clientes Recuperados']) }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Clientes Retidos']) }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Churn']) }}</TableCell>
                  <TableCell class="text-right">{{ formatMinifiedNumber(row['Inativos']) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
