<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>{{ sectorTitle }}</CardTitle>
        <CardDescription>{{ sectorDescription }}</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton v-if="isLoading" class="h-80 w-full" />
        <div
          v-else-if="!sectorSeries.length"
          class="flex h-80 items-center justify-center text-sm text-muted-foreground"
        >
          {{ emptyLabel }}
        </div>
        <apexchart
          v-else
          type="donut"
          height="400"
          :options="sectorChartOptions"
          :series="sectorSeries"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ categoryTitle }}</CardTitle>
        <CardDescription>{{ categoryDescription }}</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton v-if="isLoading" class="h-80 w-full" />
        <div
          v-else-if="!categorySeries.length"
          class="flex h-80 items-center justify-center text-sm text-muted-foreground"
        >
          {{ emptyLabel }}
        </div>
        <apexchart
          v-else
          type="donut"
          height="400"
          :options="categoryChartOptions"
          :series="categorySeries"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import VueApexCharts from "vue3-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface FinancialChartItem {
  label: string;
  value: number;
  percentage: number;
}

const props = withDefaults(
  defineProps<{
    sector: FinancialChartItem[];
    category: FinancialChartItem[];
    isLoading?: boolean;
    sectorTitle?: string;
    sectorDescription?: string;
    categoryTitle?: string;
    categoryDescription?: string;
    emptyLabel?: string;
  }>(),
  {
    isLoading: false,
    sectorTitle: "Despesas por Setor",
    sectorDescription: "Distribuição percentual das saídas por setor.",
    categoryTitle: "Despesas por Categoria",
    categoryDescription: "Distribuição percentual das saídas por categoria.",
    emptyLabel: "Nenhuma despesa encontrada no período.",
  },
);

const apexchart = VueApexCharts;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);

function buildChartOptions(items: FinancialChartItem[]): ApexOptions {
  return {
    chart: {
      type: "donut",
      toolbar: { show: false },
      animations: { enabled: true },
    },
    labels: items.map((item) => item.label),
    colors: [
      "#2563eb",
      "#16a34a",
      "#f97316",
      "#dc2626",
      "#7c3aed",
      "#0891b2",
      "#ca8a04",
      "#db2777",
    ],
    dataLabels: {
      enabled: true,
      formatter: (_value, options) =>
        `${items[options.seriesIndex]?.percentage ?? 0}%`,
    },
    legend: {
      position: "bottom",
      formatter: (seriesName, options) =>
        `${seriesName} - ${items[options.seriesIndex]?.percentage ?? 0}%`,
    },
    stroke: { width: 2, colors: ["#ffffff"] },
    tooltip: {
      y: {
        formatter: (value, options) =>
          `${formatCurrency(value)} (${items[options.seriesIndex]?.percentage ?? 0}%)`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            value: { formatter: (value) => formatCurrency(Number(value)) },
            total: {
              show: true,
              label: "Total",
              formatter: () =>
                formatCurrency(
                  items.reduce((total, item) => total + item.value, 0),
                ),
            },
          },
        },
      },
    },
  };
}

const sectorSeries = computed(() => props.sector.map((item) => item.value));
const categorySeries = computed(() => props.category.map((item) => item.value));
const sectorChartOptions = computed(() => buildChartOptions(props.sector));
const categoryChartOptions = computed(() => buildChartOptions(props.category));
</script>
