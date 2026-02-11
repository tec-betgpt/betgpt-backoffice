<template>
  <Card class="">
    <CardHeader class="pb-3">
      <div class="flex justify-between items-center align-middle">
        <CardTitle>
          {{ props.title }}
        </CardTitle>
        <GlossaryTooltipComponent v-if="glossary" :description="glossary"/>
      </div>
    </CardHeader>

    <CardContent class="h-[400px] w-full px-0 chart-container">
      <apexchart type="bar" height="350" :options="options" :series="series"></apexchart>
    </CardContent>
  </Card>
</template>
<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { defineProps } from "vue";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";

const props = defineProps<{
  title: string,
  labels: Array<string>,
  series: Array<any>,
  glossary?: string
}>();

const mode: any = useColorMode();
const options = {
  colors: mode.value === 'dark' ? ['#F6CE4C'] : ['#121212'],
  chart: {
    height: 350,
    type: 'column',
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      dataLabels: {
        position: 'top'
      },
    }
  },
  dataLabels: {
    enabled: true,
    offsetY: -20
  },

  tooltip: {
    enabled: true,
    theme: mode.value,
  },

  xaxis: {
    categories: props.labels,
    axisBorder: {
      show: false
    },
    labels: {
      show: true,
      rotate: -90,
      style: {
        colors: mode.value === 'dark' ? "#dddddd" : "#333333",
      }
    },
    axisTicks: {
      show: false
    },
    tooltip: {
      enabled: true,
    },
  },
  yaxis: {
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { show: false }
  }
}
</script>
