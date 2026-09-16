<template>
  <EmailHealthBlock
    :title="t('email_health.spam_rate.title')"
    :subtitle="t('email_health.spam_rate.subtitle')"
    source="v2"
    :loading="loadingSpam"
    :error="error"
    :is-empty="!hasSeries"
    @retry="store.refreshAll()"
  >
    <template #actions>
      <Badge
        v-if="currentBand"
        variant="outline"
        class="text-xs font-semibold"
        :class="bandBadgeClass"
      >
        <component :is="bandIcon" class="h-3 w-3 mr-1" />
        {{ t(`email_health.spam_rate.${currentBand}`) }}
      </Badge>
    </template>

    <div class="h-[260px] w-full">
      <apexchart
        v-if="hasSeries"
        width="100%"
        height="100%"
        type="line"
        :options="chartOptions"
        :series="series"
      />
    </div>

    <div class="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full bg-green-500" />
        &lt;{{ recommendedPercent }} — {{ t("email_health.spam_rate.healthy") }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full bg-amber-500" />
        ≥{{ recommendedPercent }} e &lt;{{ policyPercent }} — {{ t("email_health.spam_rate.monitor") }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full bg-red-500" />
        ≥{{ policyPercent }} — {{ t("email_health.spam_rate.critical") }}
      </span>
    </div>
  </EmailHealthBlock>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import VueApexCharts from "vue3-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useColorMode } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { AlertOctagon, CheckCircle2, Eye } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";
import type { SpamRateReference } from "@/contracts/emailHealth";

const { t } = useI18n();
const store = useEmailHealthStore();
const { spamRate, loading, errors } = storeToRefs(store);

const apexchart = VueApexCharts;
const mode = useColorMode();

const DEFAULT_REFERENCES: SpamRateReference[] = [
  { value: 0.001, percent: "0.10%", label: "Recomendado" },
  { value: 0.003, percent: "0.30%", label: "Política" },
];

const loadingSpam = computed(() => loading.value.spamRate);
const error = computed(() => errors.value.spamRate);

const references = computed<SpamRateReference[]>(() =>
  spamRate.value?.references?.length ? spamRate.value.references : DEFAULT_REFERENCES,
);

const recommendedRef = computed(
  () => references.value.find((r) => r.label === "Recomendado") ?? DEFAULT_REFERENCES[0],
);
const policyRef = computed(
  () => references.value.find((r) => r.label === "Política") ?? DEFAULT_REFERENCES[1],
);

const recommendedPercent = computed(() => recommendedRef.value.percent.replace(".", ","));
const policyPercent = computed(() => policyRef.value.percent.replace(".", ","));

const points = computed(() =>
  [...(spamRate.value?.series ?? [])].sort(
    (a, b) => moment(a.metric_date ?? 0).valueOf() - moment(b.metric_date ?? 0).valueOf(),
  ),
);

const hasSeries = computed(() => points.value.some((p) => p.available && p.value !== null));

const latestValue = computed(() => {
  for (let i = points.value.length - 1; i >= 0; i--) {
    const point = points.value[i];
    if (point.available && point.value !== null) return point.value;
  }
  return null;
});

type SpamBand = "healthy" | "monitor" | "critical";

const currentBand = computed<SpamBand | null>(() => {
  if (latestValue.value === null) return null;
  if (latestValue.value >= policyRef.value.value) return "critical";
  if (latestValue.value >= recommendedRef.value.value) return "monitor";
  return "healthy";
});

const bandBadgeClass = computed(() => {
  if (currentBand.value === "critical") return "border-red-500 text-red-500";
  if (currentBand.value === "monitor") return "border-amber-500 text-amber-500";
  return "border-green-500 text-green-500";
});

const bandIcon = computed(() => {
  if (currentBand.value === "critical") return AlertOctagon;
  if (currentBand.value === "monitor") return Eye;
  return CheckCircle2;
});

const series = computed(() => [
  {
    name: t("email_health.spam_rate.title"),
    data: points.value.map((point) => ({
      x: moment(point.metric_date).valueOf(),
      // y null gera lacuna no gráfico (dia sem dado nunca vira zero)
      y: point.available && point.value !== null ? point.value * 100 : null,
    })),
  },
]);

const chartOptions = computed((): ApexOptions => ({
  chart: {
    type: "line",
    toolbar: { show: false },
    zoom: { enabled: false },
    background: "transparent",
    fontFamily: "inherit",
  },
  stroke: { curve: "smooth", width: 2 },
  markers: { size: 3 },
  dataLabels: { enabled: false },
  colors: ["#2a9d8f"],
  xaxis: { type: "datetime", tooltip: { enabled: false } },
  yaxis: {
    labels: { formatter: (val: number) => `${val.toFixed(2)}%` },
  },
  grid: { strokeDashArray: 4 },
  legend: { show: false },
  tooltip: {
    theme: mode.value === "dark" ? "dark" : "light",
    x: { format: "dd/MM/yyyy" },
    y: {
      formatter: (val: number | null) =>
        val === null || val === undefined
          ? t("email_health.empty")
          : `${val.toFixed(3).replace(".", ",")}%`,
    },
  },
  annotations: {
    // Linhas de referência permanentes, desenhadas em qualquer período.
    yaxis: references.value.map((ref) => ({
      y: ref.value * 100,
      borderColor: ref.label === "Política" ? "#dc2626" : "#eab308",
      strokeDashArray: 4,
      label: {
        borderColor: ref.label === "Política" ? "#dc2626" : "#eab308",
        style: {
          color: "#fff",
          background: ref.label === "Política" ? "#dc2626" : "#eab308",
          fontSize: "10px",
        },
        text: `${ref.percent.replace(".", ",")} ${t(`email_health.spam_rate.${ref.label === "Política" ? "policy" : "recommended"}`)}`,
        position: "left",
        textAnchor: "start",
      },
    })),
  },
}));
</script>
