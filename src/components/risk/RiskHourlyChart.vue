<script setup lang="ts">
import { computed } from "vue";

interface RiskHourlyBucket {
  hour: string;
  count: number;
}

interface RiskHourlySeries {
  name: string;
  data: RiskHourlyBucket[];
}

const props = defineProps<{
  type: "area" | "line";
  series: RiskHourlySeries[];
  isSingleDay: boolean;
}>();

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const tooltipFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function parseHour(hour: string) {
  const match = hour.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):00:00$/);

  if (!match) {
    return Number.NaN;
  }

  const [, year, month, day, bucketHour] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(bucketHour),
    0,
    0,
  ).getTime();
}

const chartSeries = computed(() =>
  props.series.map((serie) => ({
    name: serie.name,
    data: [...(serie.data || [])]
      .map((bucket) => ({
        x: parseHour(bucket.hour),
        y: Number(bucket.count) || 0,
      }))
      .filter((point) => Number.isFinite(point.x))
      .sort((current, next) => current.x - next.x),
  })),
);

const hasData = computed(() =>
  chartSeries.value.some((serie) => serie.data.some((point) => point.y > 0)),
);

const chartOptions = computed(() => ({
  chart: {
    type: props.type,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: "inherit",
  },
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
  },
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
      formatter: (value: string) => {
        const date = new Date(Number(value));

        if (props.isSingleDay) {
          return date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        return `${date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        })} ${date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      },
    },
    tooltip: { enabled: false },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    decimalsInFloat: 0,
    labels: {
      formatter: (value: number) => integerFormatter.format(Math.round(value)),
    },
  },
  tooltip: {
    x: {
      formatter: (value: number) => tooltipFormatter.format(new Date(value)),
    },
    y: {
      formatter: (value: number) => integerFormatter.format(Math.round(value)),
      title: {
        formatter: (seriesName: string) => `${seriesName}:`,
      },
    },
  },
  grid: {
    strokeDashArray: 4,
  },
}));
</script>

<template>
  <div class="min-h-[320px] w-full">
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