<template>
  <apexchart
    v-if="hasData"
    width="100%"
    height="100%"
    type="line"
    :options="chartOptions"
    :series="series"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import VueApexCharts from "vue3-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useColorMode } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    points: { x: number; y: number | null }[];
    color?: string;
  }>(),
  { color: "#2a9d8f" },
);

const apexchart = VueApexCharts;
const mode = useColorMode();

const hasData = computed(() => props.points.some((p) => p.y !== null));

const series = computed(() => [{ name: "", data: props.points }]);

const chartOptions = computed((): ApexOptions => ({
  chart: {
    type: "line",
    sparkline: { enabled: true },
    background: "transparent",
    fontFamily: "inherit",
  },
  stroke: { curve: "smooth", width: 2 },
  colors: [props.color],
  tooltip: {
    theme: mode.value === "dark" ? "dark" : "light",
    x: { format: "dd/MM/yyyy" },
    y: {
      formatter: (val: number) => `${(val * 100).toFixed(2)}%`,
    },
  },
  xaxis: { type: "datetime" },
}));
</script>
