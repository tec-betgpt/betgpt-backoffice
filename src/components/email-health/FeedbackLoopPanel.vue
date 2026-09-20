<template>
  <EmailHealthBlock
    :title="t('email_health.feedback_loop.title')"
    :subtitle="t('email_health.feedback_loop.subtitle')"
    :source="dominantSource"
    :loading="loadingFeedback"
    :error="error"
    :is-empty="isEmpty"
    :empty-message="t('email_health.feedback_loop.empty')"
    @retry="store.refreshAll()"
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t("email_health.feedback_loop.column_id") }}</TableHead>
          <TableHead>{{ t("email_health.feedback_loop.column_match") }}</TableHead>
          <TableHead class="text-right">{{ t("email_health.feedback_loop.column_spam_rate") }}</TableHead>
          <TableHead class="text-right">{{ t("email_health.feedback_loop.column_date") }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="(item, index) in visibleItems" :key="`${item.feedback_loop_id}-${item.metric_date}-${index}`">
          <TableCell class="font-medium break-all">{{ item.feedback_loop_id }}</TableCell>
          <TableCell>{{ matchLabel(item.aggregation_key_type) }}</TableCell>
          <TableCell class="text-right">{{ formatRatio(item.spam_ratio) }}</TableCell>
          <TableCell class="text-right text-nowrap">{{ formatDate(item.metric_date) }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <div v-if="items.length > COLLAPSED_LIMIT" class="mt-3">
      <Button variant="ghost" size="sm" @click="expanded = !expanded">
        {{ expanded ? t("email_health.common.show_less") : t("email_health.common.show_all", { count: items.length }) }}
      </Button>
    </div>
  </EmailHealthBlock>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { storeToRefs } from "pinia";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";
import type { PostmasterSourceVersion } from "@/contracts/emailHealth";

const COLLAPSED_LIMIT = 10;

const { t, te } = useI18n();
const store = useEmailHealthStore();
const { feedbackLoop, loading, errors } = storeToRefs(store);

const expanded = ref(false);

const loadingFeedback = computed(() => loading.value.feedbackLoop);
const error = computed(() => errors.value.feedbackLoop);

const items = computed(() =>
  [...(feedbackLoop.value?.items ?? [])].sort(
    (a, b) => moment(b.metric_date).valueOf() - moment(a.metric_date).valueOf(),
  ),
);

const isEmpty = computed(() => !feedbackLoop.value?.available || items.value.length === 0);

const visibleItems = computed(() =>
  expanded.value ? items.value : items.value.slice(0, COLLAPSED_LIMIT),
);

const dominantSource = computed<PostmasterSourceVersion>(
  () => items.value[0]?.source_version ?? "v2",
);

function matchLabel(value: string | undefined) {
  const key = `email_health.feedback_loop.match.${value || "FROM_HEADER"}`;
  return te(key) ? t(key) : value || t("email_health.empty");
}

function formatRatio(value: number | null) {
  // null ≠ 0 — ausência de dado nunca é renderizada como 0%
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function formatDate(value: string) {
  return moment(value).format("DD/MM/YYYY");
}
</script>
