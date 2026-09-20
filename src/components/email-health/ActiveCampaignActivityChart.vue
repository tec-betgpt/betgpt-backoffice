<template>
  <EmailHealthBlock
    v-if="visible"
    :title="t('email_health.active_campaign.title')"
    :subtitle="t('email_health.active_campaign.subtitle')"
    :loading="loadingAc"
    :error="error"
    :is-empty="isEmpty"
    @retry="store.loadActiveCampaignSeries()"
  >
    <template #actions>
      <Badge variant="outline" class="text-[10px] uppercase tracking-wide font-semibold">
        {{ t("email_health.active_campaign.source") }}
      </Badge>
    </template>

    <div class="h-[380px] w-full">
      <apexchart
        v-if="!isEmpty"
        width="100%"
        height="100%"
        type="line"
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
import { Badge } from "@/components/ui/badge";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";
import { formatMinifiedNumber } from "@/filters/formatNumbers";
import type { ActiveCampaignActivityPoint } from "@/contracts/emailHealth";

const { t } = useI18n();
const store = useEmailHealthStore();
const { activeCampaign, loading, errors } = storeToRefs(store);

const apexchart = VueApexCharts;
const mode = useColorMode();

const seriesKeys = ["sends", "opens", "clicks", "unsubscribes", "bounces"] as const;
const seriesColors = ["#457b9d", "#2a9d8f", "#e9c46a", "#f4a261", "#e63946"];

const loadingAc = computed(() => loading.value.activeCampaign);
const error = computed(() => errors.value.activeCampaign);
const connected = computed(() => activeCampaign.value?.connected === true);

const visible = computed(
  () => loadingAc.value || Boolean(error.value) || connected.value,
);

const points = computed<ActiveCampaignActivityPoint[]>(() =>
  [...(activeCampaign.value?.series ?? [])].sort(
    (a, b) => moment(a.date).valueOf() - moment(b.date).valueOf(),
  ),
);

const isEmpty = computed(
  () => !loadingAc.value && !error.value && connected.value && points.value.length === 0,
);

const series = computed(() =>
  seriesKeys.map((key) => ({
    name: t(`email_health.active_campaign.${key}`),
    data: points.value.map((point) => ({
      x: moment(point.date).valueOf(),
      y: point[key],
    })),
  })),
);

const chartOptions = computed((): ApexOptions => ({
  chart: {
    type: "line",
    toolbar: { show: false },
    zoom: { enabled: false },
    background: "transparent",
    fontFamily: "inherit",
  },
  stroke: {
    curve: "smooth",
    width: 3,
  },
  dataLabels: { enabled: false },
  colors: seriesColors,
  xaxis: {
    type: "datetime",
    tooltip: { enabled: false },
    labels: {
      datetimeUTC: false,
      style: {
        colors: mode.value === "dark" ? "#94a3b8" : "#64748b",
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatMinifiedNumber(val),
      style: {
        colors: mode.value === "dark" ? "#94a3b8" : "#64748b",
      },
    },
  },
  grid: { strokeDashArray: 4 },
  legend: {
    position: "top",
    horizontalAlign: "center",
    labels: {
      colors: mode.value === "dark" ? "#f8fafc" : "#1e293b",
    },
  },
  tooltip: {
    theme: mode.value === "dark" ? "dark" : "light",
    shared: true,
    intersect: false,
    x: { format: "dd/MM/yyyy" },
    y: {
      formatter: (val: number | null) =>
        val === null || val === undefined ? t("email_health.empty") : formatMinifiedNumber(val),
    },
  },
}));
</script>
