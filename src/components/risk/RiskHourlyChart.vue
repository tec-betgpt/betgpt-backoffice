<script setup lang="ts">
import { computed } from "vue";
import { useColorMode } from "@vueuse/core";
import VueApexCharts from "vue3-apexcharts";

const apexchart = VueApexCharts;

interface RiskHourlySeries {
  key: string;
  label: string;
  data: (number | null)[];
}

const props = defineProps<{
  type: "area" | "line" | "bar";
  title?: string;
  categories: string[];
  series: RiskHourlySeries[];
  seriesLabels?: Record<string, string>;
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

function formatValue(value: number | null) {
  if (value === null) {
    return "-";
  }

  const parsedValue = Number(value) || 0;

  return props.valueType === "money"
    ? moneyFormatter.format(parsedValue)
    : integerFormatter.format(Math.round(parsedValue));
}

function getSerieName(serie: RiskHourlySeries) {
  const labelKey = serie.label.toLowerCase();

  return props.seriesLabels?.[serie.key] || props.seriesLabels?.[labelKey] || serie.label;
}

const chartSeries = computed(() =>
  props.series.map((serie) => ({
    name: getSerieName(serie),
    data: (serie.data || []).map((value) => (value === null ? null : Number(value) || 0)),
  })),
);

const canRender = computed(() =>
  props.categories.length > 0
  && chartSeries.value.length > 0
  && chartSeries.value.some((serie) => serie.data.some((point) => point !== null && point > 0)),
);

const isDarkMode = computed(() => mode.value === "dark");
const chartTextColor = computed(() => (isDarkMode.value ? "#d4d4d8" : "#52525b"));
const chartForegroundColor = computed(() => (isDarkMode.value ? "#f4f4f5" : "#18181b"));
const chartBorderColor = computed(() => (isDarkMode.value ? "#3f3f46" : "#e4e4e7"));

const chartOptions = computed(() => ({
  chart: {
    type: props.type,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: "inherit",
    foreColor: chartTextColor.value,
    background: "transparent",
    animations: {
      enabled: true,
    },
  },
  theme: {
    mode: isDarkMode.value ? "dark" : "light",
  },
  colors: chartColors,
  stroke: {
    curve: "smooth",
    width: props.type === "area" ? 3 : props.type === "line" ? 2 : 0,
  },
  dataLabels: { enabled: false },
  fill: {
    type: props.type === "area" ? "gradient" : "solid",
    opacity: props.type === "area" ? 0.35 : 1,
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.05,
      stops: [0, 90, 100],
    },
  },
  ...(props.type === "bar"
    ? {
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: "55%",
          },
        },
      }
    : {}),
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
      formatter: (value: number | null) => formatValue(value),
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
    <div v-if="canRender" class="h-[320px] w-full">
      <apexchart
        width="100%"
        height="100%"
        :type="type"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
    <div
      v-else
      class="flex h-[320px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
    >
      Sem dados no periodo selecionado
    </div>
  </div>
</template>
