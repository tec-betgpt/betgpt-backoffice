<template>
  <EmailHealthBlock
    :title="t('email_health.ip_reputation.title')"
    :subtitle="t('email_health.ip_reputation.subtitle')"
    source="v1"
    :loading="loadingIp"
    :error="error"
    :is-empty="!hasSeries"
    @retry="store.refreshAll()"
  >
    <template #actions>
      <Badge
        v-if="latestCategory"
        variant="outline"
        class="text-xs font-semibold"
        :style="{ borderColor: categoryColor(latestCategory), color: categoryColor(latestCategory) }"
      >
        {{ t(`email_health.reputation.${latestCategory}`) }}
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
        type="bar"
        :options="chartOptions"
        :series="series"
      />
    </div>

    <p class="mt-3 text-xs text-muted-foreground">
      {{ t("email_health.ip_reputation.latest_label") }}:
      <span v-if="latestCategory" class="font-medium text-foreground">
        {{ t(`email_health.reputation.${latestCategory}`) }}
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
import type { IpReputationCategory, IpReputationDay } from "@/contracts/emailHealth";

const { t } = useI18n();
const store = useEmailHealthStore();
const { ipReputation, overview, loading, errors } = storeToRefs(store);

const apexchart = VueApexCharts;
const mode = useColorMode();

const CATEGORIES: IpReputationCategory[] = ["HIGH", "MEDIUM", "LOW", "BAD"];
const CATEGORY_COLORS: Record<IpReputationCategory, string> = {
  HIGH: "#16a34a",
  MEDIUM: "#eab308",
  LOW: "#f97316",
  BAD: "#dc2626",
};

const loadingIp = computed(() => loading.value.ipReputation);
const error = computed(() => errors.value.ipReputation);

const days = computed<IpReputationDay[]>(() =>
  [...(ipReputation.value?.series ?? [])]
    .filter((d) => d.available && Object.keys(d.categories).length > 0)
    .sort((a, b) => moment(a.metric_date).valueOf() - moment(b.metric_date).valueOf()),
);

const hasSeries = computed(() => days.value.length > 0);

const latestCategory = computed<IpReputationCategory | null>(() => {
  const categories = overview.value?.ip_reputation?.categories;
  if (!overview.value?.ip_reputation?.available || !categories) return null;

  let best: IpReputationCategory | null = null;
  let bestShare = -1;
  for (const category of CATEGORIES) {
    const data = categories[category];
    if (data && data.share > bestShare) {
      best = category;
      bestShare = data.share;
    }
  }
  return best;
});

const latestDate = computed(() => {
  const value = overview.value?.ip_reputation?.metric_date;
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

function categoryColor(category: IpReputationCategory) {
  return CATEGORY_COLORS[category];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const series = computed(() =>
  CATEGORIES.map((category) => ({
    name: t(`email_health.reputation.${category}`),
    data: days.value.map((day) => ({
      x: moment(day.metric_date).valueOf(),
      y: Math.round((day.categories[category]?.share ?? 0) * 10000) / 100,
    })),
  })),
);

const chartOptions = computed((): ApexOptions => ({
  chart: {
    type: "bar",
    stacked: true,
    stackType: "100%",
    toolbar: { show: false },
    zoom: { enabled: false },
    background: "transparent",
    fontFamily: "inherit",
  },
  plotOptions: {
    bar: { horizontal: false, columnWidth: "60%", borderRadius: 1 },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 1, colors: ["transparent"] },
  xaxis: { type: "datetime", tooltip: { enabled: false } },
  yaxis: {
    max: 100,
    labels: { formatter: (val: number) => `${Math.round(val)}%` },
  },
  legend: {
    position: "top",
    labels: { colors: mode.value === "dark" ? "#f8fafc" : "#1e293b" },
  },
  colors: CATEGORIES.map((c) => CATEGORY_COLORS[c]),
  grid: { strokeDashArray: 4 },
  tooltip: {
    theme: mode.value === "dark" ? "dark" : "light",
    custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
      const day = days.value[dataPointIndex];
      if (!day) return "";

      const rows = CATEGORIES
        .filter((category) => day.categories[category])
        .map((category) => {
          const data = day.categories[category]!;
          const sharePct = (data.share * 100).toFixed(1);
          const samples = data.sample_ips?.length
            ? `<div style="margin-top:4px;font-size:11px;opacity:.75">${t("email_health.ip_reputation.tooltip_samples")}: ${data.sample_ips.map(escapeHtml).join(", ")}</div>`
            : "";
          return `<div style="padding:4px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${CATEGORY_COLORS[category]};margin-right:6px"></span>
            <strong>${escapeHtml(t(`email_health.reputation.${category}`))}</strong>:
            ${data.ip_count} ${escapeHtml(t("email_health.ip_reputation.tooltip_ips"))}
            (${sharePct}% ${escapeHtml(t("email_health.ip_reputation.tooltip_share"))})
            ${samples}
          </div>`;
        })
        .join("");

      return `<div style="padding:10px;min-width:200px">
        <div style="font-weight:600;margin-bottom:4px">${moment(day.metric_date).format("DD/MM/YYYY")}</div>
        ${rows}
      </div>`;
    },
  },
}));
</script>
