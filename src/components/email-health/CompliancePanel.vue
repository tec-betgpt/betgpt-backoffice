<template>
  <EmailHealthBlock
    :title="t('email_health.compliance.title')"
    :subtitle="t('email_health.compliance.subtitle')"
    source="v2"
    :loading="loadingCompliance"
    :error="error"
    :is-empty="isEmpty"
    empty-variant="unavailable"
    @retry="store.refreshAll()"
  >
    <div
      v-if="allCompliant"
      class="mb-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
    >
      <ShieldCheck class="h-4 w-4" />
      {{ t("email_health.compliance.all_compliant") }}
    </div>

    <ul class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      <li
        v-for="item in latest"
        :key="item.requirement"
        class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
        :class="
          item.needs_work
            ? 'border-amber-500 border-l-4 bg-amber-500/10'
            : 'border-border'
        "
      >
        <AlertTriangle
          v-if="item.needs_work"
          class="h-4 w-4 mt-0.5 shrink-0 text-amber-500"
        />
        <CheckCircle2 v-else class="h-4 w-4 mt-0.5 shrink-0 text-green-500" />

        <div class="min-w-0">
          <p class="font-medium leading-tight">{{ requirementLabel(item.requirement) }}</p>
          <p class="text-xs" :class="item.needs_work ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">
            {{ item.needs_work ? t("email_health.compliance.needs_work") : t("email_health.compliance.compliant") }}
          </p>
          <p v-if="item.reason" class="text-xs text-muted-foreground mt-1 break-words">
            {{ item.reason }}
          </p>
        </div>
      </li>
    </ul>

    <p v-if="latestDate" class="mt-3 text-xs text-muted-foreground">
      {{ t("email_health.common.latest_value") }}: {{ latestDate }}
    </p>
  </EmailHealthBlock>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { storeToRefs } from "pinia";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-vue-next";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";

const { t, te } = useI18n();
const store = useEmailHealthStore();
const { compliance, loading, errors } = storeToRefs(store);

const loadingCompliance = computed(() => loading.value.compliance);
const error = computed(() => errors.value.compliance);

const latest = computed(() => compliance.value?.latest ?? []);

const isEmpty = computed(() => !compliance.value?.available || latest.value.length === 0);

const allCompliant = computed(
  () => latest.value.length > 0 && latest.value.every((item) => !item.needs_work),
);

const latestDate = computed(() => {
  const value = latest.value[0]?.metric_date;
  return value ? moment(value).format("DD/MM/YYYY") : null;
});

function requirementLabel(requirement: string) {
  const key = `email_health.compliance.requirements.${requirement}`;
  if (te(key)) return t(key);
  return requirement
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
</script>
