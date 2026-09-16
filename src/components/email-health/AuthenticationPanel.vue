<template>
  <EmailHealthBlock
    :title="t('email_health.authentication.title')"
    :subtitle="t('email_health.authentication.subtitle')"
    :source="dominantSource"
    :loading="loadingAuth"
    :error="error"
    :is-empty="!hasSeries"
    @retry="store.refreshAll()"
  >
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
import type { AuthSeriesPoint, PostmasterSourceVersion } from "@/contracts/emailHealth";

type AuthKey = "spf" | "dkim" | "dmarc";

const { t } = useI18n();
const store = useEmailHealthStore();
const { authentication, loading, errors } = storeToRefs(store);

const metrics: { key: AuthKey; label: string; color: string }[] = [
  { key: "spf", label: t("email_health.authentication.spf"), color: "#2a9d8f" },
  { key: "dkim", label: t("email_health.authentication.dkim"), color: "#457b9d" },
  { key: "dmarc", label: t("email_health.authentication.dmarc"), color: "#8b5cf6" },
];

const loadingAuth = computed(() => loading.value.authentication);
const error = computed(() => errors.value.authentication);

const series = computed<AuthSeriesPoint[]>(() =>
  [...(authentication.value?.series ?? [])].sort(
    (a, b) => moment(a.metric_date).valueOf() - moment(b.metric_date).valueOf(),
  ),
);

const hasSeries = computed(() =>
  series.value.some((p) => p.available && (p.spf !== null || p.dkim !== null || p.dmarc !== null)),
);

const dominantSource = computed<PostmasterSourceVersion>(
  () => series.value[series.value.length - 1]?.source_version ?? "v2",
);

function latestValue(key: AuthKey): number | null {
  for (let i = series.value.length - 1; i >= 0; i--) {
    const point = series.value[i];
    if (point.available && point[key] !== null) return point[key];
  }
  return null;
}

function sparkPoints(key: AuthKey) {
  return series.value.map((point) => ({
    x: moment(point.metric_date).valueOf(),
    y: point.available ? point[key] : null,
  }));
}

function formatRatio(value: number | null) {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}
</script>
