<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>
    <CardContent>
      <apexchart v-if="!isLoading" type="pie" height="350" :options="chartOptions" :series="series"></apexchart>
      <div v-else class="h-[350px] w-full flex items-center justify-center">
        <Loader2Icon class="h-10 w-10 animate-spin" />
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2Icon } from 'lucide-vue-next';

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({})
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Distribuição de Conversões'
  }
});

const series = computed(() => props.chartData?.series || []);
const labels = computed(() => props.chartData?.labels || []);

const chartOptions = computed(() => ({
  chart: {
    height: 350,
    type: 'pie',
  },
  labels: labels.value,
  series: series.value,
  legend: {
    position: 'bottom'
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: '100%'
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
}));
</script>
