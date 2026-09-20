<template>
  <EmailHealthBlock
    :title="t('email_health.reputation_errors.title')"
    :subtitle="t('email_health.reputation_errors.subtitle')"
    :loading="loadingErrors"
    :error="error"
    :is-empty="!hasSeries"
    @retry="store.refreshAll()"
  >
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="rounded-md border border-border p-3"
      >
        <p class="text-xs text-muted-foreground">{{ metric.label }}</p>
        <p class="text-lg font-semibold">
          <span v-if="latestCount(metric.key) !== null">{{ latestCount(metric.key) }}</span>
          <span v-else class="text-muted-foreground text-sm font-normal">{{ t("email_health.empty") }}</span>
        </p>
      </div>
    </div>

    <div class="h-[180px] w-full">
      <apexchart
        v-if="hasSeries"
        width="100%"
        height="100%"
        type="bar"
        :options="chartOptions"
        :series="series"
      />
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
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";

type ReputationReason = "low_ip_reputation" | "low_domain_reputation";

const { t } = useI18n();
const store = useEmailHealthStore();
const { deliveryErrors, loading, errors } = storeToRefs(store);
const apexchart = VueApexCharts;
const mode = useColorMode();

const metrics: { key: ReputationReason; label: string; color: string }[] = [
  { key: "low_ip_reputation", label: t("email_health.reputation_errors.low_ip"), color: "#e76f51" },
  { key: "low_domain_reputation", label: t("email_health.reputation_errors.low_domain"), color: "#457b9d" },
];

const loadingErrors = computed(() => loading.value.deliveryErrors);
const error = computed(() => errors.value.deliveryErrors);

const days = computed(() => {
  const byDate = new Map<string, Record<ReputationReason, number | null>>();
  for (const day of deliveryErrors.value?.series ?? []) {
    if (!day.available) continue;
    const bucket: Record<ReputationReason, number | null> = {
      low_ip_reputation: null,
      low_domain_reputation: null,
    };
    for (const entry of day.errors) {
      const reason = entry.error_reason as ReputationReason;
      if (reason !== "low_ip_reputation" && reason !== "low_domain_reputation") continue;
      bucket[reason] = entry.error_count;
    }
    if (bucket.low_ip_reputation !== null || bucket.low_domain_reputation !== null) {
      byDate.set(day.metric_date, bucket);
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => moment(a[0]).valueOf() - moment(b[0]).valueOf())
    .map(([date, values]) => ({ date, ...values }));
});

const hasSeries = computed(() => days.value.length > 0);

function latestCount(key: ReputationReason): number | null {
  for (let i = days.value.length - 1; i >= 0; i--) {
    if (days.value[i][key] !== null) return days.value[i][key];
  }
  return null;
}

const series = computed(() =>
  metrics.map((metric) => ({
    name: metric.label,
    data: days.value.map((day) => ({
      x: moment(day.date).valueOf(),
      y: day[metric.key],
    })),
  })),
);

const chartOptions = computed((): ApexOptions => ({
  chart: {
    type: "bar",
    toolbar: { show: false },
    zoom: { enabled: false },
    background: "transparent",
    fontFamily: "inherit",
  },
  plotOptions: { bar: { columnWidth: "55%", borderRadius: 2 } },
  dataLabels: { enabled: false },
  colors: metrics.map((metric) => metric.color),
  xaxis: { type: "datetime", tooltip: { enabled: false } },
  yaxis: { labels: { formatter: (val: number) => String(Math.round(val)) } },
  legend: { position: "top" },
  grid: { strokeDashArray: 4 },
  tooltip: {
    theme: mode.value === "dark" ? "dark" : "light",
    x: { format: "dd/MM/yyyy" },
  },
}));
</script>
