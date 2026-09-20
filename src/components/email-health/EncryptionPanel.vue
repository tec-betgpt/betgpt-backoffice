<template>
  <EmailHealthBlock
    :title="t('email_health.encryption.title')"
    :subtitle="t('email_health.encryption.subtitle')"
    :source="dominantSource"
    :loading="loadingTls"
    :error="error"
    :is-empty="!hasSeries"
    @retry="store.refreshAll()"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="rounded-md border border-border p-3"
      >
        <p class="text-xs text-muted-foreground">{{ metric.label }}</p>
        <p class="text-lg font-semibold">
          <span v-if="latestValue(metric.key) !== null">{{ formatRatio(latestValue(metric.key)) }}</span>
          <span v-else class="text-muted-foreground text-sm font-normal">{{ t("email_health.empty") }}</span>
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ t("email_health.encryption.messages") }}:
          <span v-if="latestCount(metric.key) !== null">{{ formatCount(latestCount(metric.key)) }}</span>
          <span v-else>{{ t("email_health.empty") }}</span>
        </p>
        <div class="h-12 mt-1">
          <MiniSparkline :points="sparkPoints(metric.key)" :color="metric.color" />
        </div>
      </div>
    </div>
  </EmailHealthBlock>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { storeToRefs } from "pinia";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import MiniSparkline from "@/components/email-health/MiniSparkline.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";
import type { PostmasterSourceVersion, TlsSeriesPoint } from "@/contracts/emailHealth";

type TlsKey = "inbound" | "outbound";

const { t } = useI18n();
const store = useEmailHealthStore();
const { encryption, loading, errors } = storeToRefs(store);

const metrics: { key: TlsKey; label: string; color: string }[] = [
  { key: "inbound", label: t("email_health.encryption.inbound"), color: "#2a9d8f" },
  { key: "outbound", label: t("email_health.encryption.outbound"), color: "#e76f51" },
];

const loadingTls = computed(() => loading.value.encryption);
const error = computed(() => errors.value.encryption);

const series = computed<TlsSeriesPoint[]>(() =>
  [...(encryption.value?.series ?? [])].sort(
    (a, b) => moment(a.metric_date).valueOf() - moment(b.metric_date).valueOf(),
  ),
);

const hasSeries = computed(() =>
  series.value.some((p) => p.available && (p.inbound !== null || p.outbound !== null || p.inbound_count !== null || p.outbound_count !== null)),
);

const dominantSource = computed<PostmasterSourceVersion>(
  () => series.value[series.value.length - 1]?.source_version ?? "v2",
);

function latestValue(key: TlsKey): number | null {
  for (let i = series.value.length - 1; i >= 0; i--) {
    const point = series.value[i];
    if (point.available && point[key] !== null) return point[key];
  }
  return null;
}

function sparkPoints(key: TlsKey) {
  return series.value.map((point) => ({
    x: moment(point.metric_date).valueOf(),
    y: point.available ? point[key] : null,
  }));
}

function latestCount(key: TlsKey): number | null {
  const countKey = key === "inbound" ? "inbound_count" : "outbound_count";
  for (let i = series.value.length - 1; i >= 0; i--) {
    const point = series.value[i];
    if (point.available && point[countKey] !== null && point[countKey] !== undefined) {
      return point[countKey];
    }
  }
  return null;
}

function formatRatio(value: number | null) {
  if (value === null) return t("email_health.empty");
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function formatCount(value: number | null) {
  if (value === null) return t("email_health.empty");
  return new Intl.NumberFormat("pt-BR").format(value);
}
</script>
