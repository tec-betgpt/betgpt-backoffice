<script setup lang="ts">
import {ref, watch, onMounted, computed} from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import Analytics from "@/services/analytics";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";

import { formatMinifiedNumber, numberLocale } from "@/filters/formatNumbers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import CompositionActiveClientsChart from "@/components/analytics_retention/CompositionActiveClientsChart.vue";
import NewRecoveredRetainedChart from "@/components/analytics_retention/NewRecoveredRetainedChart.vue";

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

computed(() => [
  totals.value['Novos Clientes'],
  totals.value['Clientes Recuperados'],
  totals.value['Clientes Retidos'],
  totals.value['Churn'],
]);

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

useScreenContext(
    "Tela de retenção de analytics - Exibe métricas de retenção de clientes",
    () => ({
      "start_date": selectedRange.value.start ? selectedRange.value.start.toString() : "",
      "end_date": selectedRange.value.end ? selectedRange.value.end.toString() : "",
    }),
    "/v1/analytics/client-classification"
);
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
      <CompositionActiveClientsChart :data="chartRetentionData" :is-loading="isLoading" />
      <NewRecoveredRetainedChart :data="chartRetentionData" :is-loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4" v-if="!isLoading && retentionData.length > 0">
      <Card class="overflow-hidden flex flex-col lg:col-span-3">
        <CardHeader class="py-4 shrink-0">
          <CardTitle>Detalhamento Diário</CardTitle>
        </CardHeader>z
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
