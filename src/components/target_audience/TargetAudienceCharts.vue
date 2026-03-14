<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Bar Chart -->
    <Card class="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle>Comparativo de Correspondência (Match Rate)</CardTitle>
        <CardDescription>Comparação do tamanho do público no Elevate vs Alcance no Meta Ads (Top 5)</CardDescription>
      </CardHeader>
      <CardContent>
        <apexchart type="bar" height="320" :options="computedBarOptions" :series="barSeries" />
      </CardContent>
    </Card>

    <!-- Donut Chart -->
    <Card class="col-span-1 shadow-sm">
      <CardHeader>
        <CardTitle>Distribuição de Públicos</CardTitle>
        <CardDescription>Status de Sincronização</CardDescription>
      </CardHeader>
      <CardContent class="flex  items-center justify-center h-[320px] pb-6">
        <apexchart type="donut" width="100%" height="280" :options="computedDonutOptions" :series="donutSeries" />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import VueApexCharts from "vue3-apexcharts";

const apexchart = VueApexCharts;

const props = defineProps<{
  barSeries: any[];
  barOptions: any;
  donutSeries: any[];
  donutOptions: any;
}>();

const isDark = ref(document.documentElement.classList.contains('dark'));

// Observador para mudanças na classe 'dark' do documento
onMounted(() => {
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark');
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

const computedBarOptions = computed(() => {
  if (!isDark.value) return props.barOptions;
  
  return {
    ...props.barOptions,
    chart: { ...props.barOptions.chart, foreColor: '#94a3b8' },
    grid: { ...props.barOptions.grid, borderColor: '#1e293b' },
    xaxis: {
      ...props.barOptions.xaxis,
      labels: { ...props.barOptions.xaxis.labels, style: { colors: '#94a3b8' } }
    },
    yaxis: {
      ...props.barOptions.yaxis,
      labels: { ...props.barOptions.yaxis.labels, style: { colors: '#94a3b8' } }
    },
    tooltip: { ...props.barOptions.tooltip, theme: 'dark' }
  };
});

const computedDonutOptions = computed(() => {
  if (!isDark.value) return props.donutOptions;

  return {
    ...props.donutOptions,
    chart: { ...props.donutOptions.chart, foreColor: '#94a3b8' },
    legend: { ...props.donutOptions.legend, labels: { colors: '#94a3b8' } },
    plotOptions: {
      ...props.donutOptions.plotOptions,
      pie: {
        ...props.donutOptions.plotOptions?.pie,
        donut: {
          ...props.donutOptions.plotOptions?.pie?.donut,
          labels: {
            ...props.donutOptions.plotOptions?.pie?.donut?.labels,
            name: { ...props.donutOptions.plotOptions?.pie?.donut?.labels?.name, color: '#94a3b8' },
            value: { ...props.donutOptions.plotOptions?.pie?.donut?.labels?.value, color: '#f1f5f9' },
            total: { ...props.donutOptions.plotOptions?.pie?.donut?.labels?.total, color: '#94a3b8' }
          }
        }
      }
    },
    tooltip: { ...props.donutOptions.tooltip, theme: 'dark' }
  };
});
</script>
