<template>
  <Card>
    <CardHeader>
      <CardTitle>Receita Total por Canal</CardTitle>
    </CardHeader>

    <Separator />

    <CardContent class="pt-5">
      <apexchart type="pie" :options="chartOptions" :series="series" />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const props = defineProps({
  groupSessionData: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const series = computed(() =>
  props.groupSessionData.map((item: any) => item.totalRevenue)
);

const chartOptions = computed(() => ({
  labels: props.groupSessionData.map((item: any) => item.channel),
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    formatter: function (val: number) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
  },
  tooltip: {
    y: {
      formatter: function (val: number) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      }
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
}));
</script>
