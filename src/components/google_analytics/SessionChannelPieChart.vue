<template>
  <Card>
    <CardHeader>
      <CardTitle>Sessões por Canal</CardTitle>
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

const series = computed(() => props.groupSessionData.map((item: any) => item.sessions));

const chartOptions = computed(() => ({
  labels: props.groupSessionData.map((item: any) => item.channel),
  legend: {
    position: 'bottom',
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
