<script setup lang="ts">
import { computed } from "vue";
import { useColorMode } from "@vueuse/core";

interface RiskHourlySeries {
  key: string;
  label: string;
  data: number[];
}

const props = defineProps<{
  type: "area" | "line";
  title?: string;
  categories: string[];
  series: RiskHourlySeries[];
  valueType?: "integer" | "money";
}>();

const chartColors = ["#947c2c", "#f4a261", "#c3c3c3", "#2a9d8f"];
const mode = useColorMode();
const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatValue(value: number) {
  const parsedValue = Number(value) || 0;

  return props.valueType === "money"
    ? moneyFormatter.format(parsedValue)
    : integerFormatter.format(Math.round(parsedValue));
}

const chartSeries = computed(() =>
  props.series.map((serie) => ({
    name: serie.label,
    data: (serie.data || []).map((value) => Number(value) || 0),
  })),
);

const hasData = computed(() =>
  chartSeries.value.some((serie) => serie.data.some((point) => point > 0)),
);

const isDarkMode = computed(() => mode.value === "dark");
const chartTextColor = computed(() => isDarkMode.value ? "#d4d4d8" : "#52525b");
const chartForegroundColor = computed(() => isDarkMode.value ? "#f4f4f5" : "#18181b");
const chartBorderColor = computed(() => isDarkMode.value ? "#3f3f46" : "#e4e4e7");

const chartOptions = computed(() => ({
  chart: {
    type: props.type,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: "inherit",
    foreColor: chartTextColor.value,
    background: "transparent",
  },
  theme: {
    mode: isDarkMode.value ? "dark" : "light",
  },
  colors: chartColors,
  stroke: {
    curve: "smooth",
    width: props.type === "area" ? 3 : 2,
  },
  dataLabels: { enabled: false },
  fill: {
    type: props.type === "area" ? "gradient" : "solid",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.05,
      stops: [0, 90, 100],
    },
  },
  legend: {
    show: props.series.length > 1,
    position: "top",
    horizontalAlign: "right",
    labels: {
      colors: chartForegroundColor.value,
    },
  },
  xaxis: {
    categories: props.categories || [],
    labels: {
      style: {
        colors: chartTextColor.value,
      },
    },
    tooltip: { enabled: false },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    decimalsInFloat: 0,
    labels: {
      formatter: (value: number) => formatValue(value),
      style: {
        colors: chartTextColor.value,
      },
    },
  },
  tooltip: {
    theme: isDarkMode.value ? "dark" : "light",
    x: {
      formatter: (value: string) => value,
    },
    y: {
      formatter: (value: number) => formatValue(value),
      title: {
        formatter: (seriesName: string) => `${seriesName}:`,
      },
    },
  },
  grid: {
    strokeDashArray: 4,
    borderColor: chartBorderColor.value,
  },
}));
</script>

<template>
  <div class="min-h-[320px] w-full">
    <p v-if="title" class="mb-3 text-sm font-medium text-muted-foreground">{{ title }}</p>
    <apexchart
      v-if="hasData"
      :type="type"
      height="320"
      :options="chartOptions"
      :series="chartSeries"
    />
    <div
      v-else
      class="flex h-[320px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
    >
      Sem dados no periodo selecionado
    </div>
  </div>
</template>