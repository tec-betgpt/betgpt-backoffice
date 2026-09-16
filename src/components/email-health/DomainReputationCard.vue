<template>
  <EmailHealthBlock
    :title="t('email_health.domain_reputation.title')"
    :subtitle="t('email_health.domain_reputation.subtitle')"
    source="v1"
    :loading="loadingDomain"
    :error="error"
    :is-empty="!hasSeries"
    @retry="store.refreshAll()"
  >
    <template #actions>
      <Badge
        v-if="latestReputation"
        variant="outline"
        class="text-xs font-semibold"
        :style="{ borderColor: reputationColor(latestReputation), color: reputationColor(latestReputation) }"
      >
        {{ reputationLabel(latestReputation) }}
      </Badge>
    </template>

    <Alert v-if="legacyDown" class="mb-4 border-amber-500/60 bg-amber-500/10">
      <AlertTriangle class="h-4 w-4 text-amber-500" />
      <AlertDescription class="text-xs">
        {{ t("email_health.legacy_source_down", { date: legacyDate }) }}
      </AlertDescription>
    </Alert>

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

    <p class="mt-3 text-xs text-muted-foreground">
      {{ t("email_health.domain_reputation.latest_label") }}:
      <span v-if="latestReputation" class="font-medium text-foreground">
        {{ reputationLabel(latestReputation) }}
      </span>
      <span v-else class="font-medium">{{ t("email_health.empty") }}</span>
      <span v-if="latestDate" class="text-muted-foreground"> ({{ latestDate }})</span>
    </p>
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
import { AlertTriangle } from "lucide-vue-next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";

const { t, te } = useI18n();
const store = useEmailHealthStore();
const { domainReputation, overview, loading, errors } = storeToRefs(store);

const apexchart = VueApexCharts;
const mode = useColorMode();

// Posições de eixo APENAS para renderização — o eixo Y permanece categórico.
const CATEGORY_POSITION: Record<string, number> = {
  BAD: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const CATEGORY_COLORS: Record<string, string> = {
  HIGH: "#16a34a",
  MEDIUM: "#eab308",
  LOW: "#f97316",
  BAD: "#dc2626",
};

const loadingDomain = computed(() => loading.value.domainReputation);
const error = computed(() => errors.value.domainReputation);

const points = computed(() =>
  [...(domainReputation.value?.series ?? [])].sort(
    (a, b) => moment(a.metric_date ?? 0).valueOf() - moment(b.metric_date ?? 0).valueOf(),
  ),
);

const hasSeries = computed(() => points.value.some((p) => p.available && p.value !== null));

const latestReputation = computed(() => {
  const point = overview.value?.domain_reputation;
  return point?.available && point.value ? point.value : null;
});

const latestDate = computed(() => {
  const value = overview.value?.domain_reputation?.metric_date;
  return value ? moment(value).format("DD/MM/YYYY") : null;
});

const legacyDown = computed(() => {
  const status = overview.value?.sources?.v1?.status;
  return !!status && status !== "ok";
});

const legacyDate = computed(() => {
  const value = overview.value?.sources?.v1?.last_data_date;
  return value ? moment(value).format("DD/MM/YYYY") : "—";
});

function reputationLabel(value: string) {
  const key = `email_health.reputation.${value}`;
  return te(key) ? t(key) : value;
}

function reputationColor(value: string) {
  return CATEGORY_COLORS[value] ?? "#64748b";
}

const series = computed(() => [
  {
    name: t("email_health.domain_reputation.title"),
    data: points.value.map((point) => ({
      x: moment(point.metric_date).valueOf(),
      // y null gera lacuna no gráfico (dia sem dado nunca vira zero)
      y:
        point.available && point.value && point.value in CATEGORY_POSITION
          ? CATEGORY_POSITION[point.value]
          : null,
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
  stroke: { curve: "stepline", width: 2 },
  markers: { size: 3 },
  dataLabels: { enabled: false },
  colors: ["#457b9d"],
  xaxis: { type: "datetime", tooltip: { enabled: false } },
  yaxis: {
    min: 0,
    max: 3,
    tickAmount: 3,
    labels: {
      formatter: (val: number) => {
        const category = Object.keys(CATEGORY_POSITION).find(
          (key) => CATEGORY_POSITION[key] === Math.round(val),
        );
        return category ? reputationLabel(category) : "";
      },
    },
  },
  grid: { strokeDashArray: 4 },
  legend: { show: false },
  tooltip: {
    theme: mode.value === "dark" ? "dark" : "light",
    x: { format: "dd/MM/yyyy" },
    y: {
      formatter: (val: number | null) => {
        if (val === null || val === undefined) return t("email_health.empty");
        const category = Object.keys(CATEGORY_POSITION).find(
          (key) => CATEGORY_POSITION[key] === val,
        );
        return category ? reputationLabel(category) : String(val);
      },
    },
  },
}));
</script>
