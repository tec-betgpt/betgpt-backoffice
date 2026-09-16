<template>
  <EmailHealthBlock
    :title="t('email_health.delivery_errors.title')"
    :subtitle="t('email_health.delivery_errors.subtitle')"
    :source="activeTab === 'v1' ? 'v1' : 'v2'"
    :loading="loadingErrors"
    :error="error"
    :is-empty="!hasAnyData"
    :empty-message="t('email_health.delivery_errors.empty')"
    @retry="store.refreshAll()"
  >
    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="reject">{{ t("email_health.delivery_errors.tab_reject") }}</TabsTrigger>
        <TabsTrigger value="temp_fail">{{ t("email_health.delivery_errors.tab_temp_fail") }}</TabsTrigger>
        <TabsTrigger v-if="otherRows.length" value="other">
          {{ t("email_health.delivery_errors.tab_other") }}
        </TabsTrigger>
        <TabsTrigger v-if="v1Rows.length" value="v1">
          {{ t("email_health.delivery_errors.tab_v1") }}
        </TabsTrigger>
      </TabsList>

      <TabsContent v-for="tab in ['reject', 'temp_fail', 'other', 'v1']" :key="tab" :value="tab">
        <EmailHealthEmptyState
          v-if="!rowsFor(tab).length"
          :message="t('email_health.delivery_errors.empty')"
        />
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("email_health.delivery_errors.column_date") }}</TableHead>
              <TableHead>{{ tab === 'v1' ? t("email_health.delivery_errors.column_type") : t("email_health.delivery_errors.column_reason") }}</TableHead>
              <TableHead class="text-right">{{ t("email_health.delivery_errors.column_count") }}</TableHead>
              <TableHead class="text-right">{{ t("email_health.delivery_errors.column_rate") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(row, index) in rowsFor(tab)" :key="`${row.date}-${row.label}-${index}`">
              <TableCell class="text-nowrap">{{ row.date }}</TableCell>
              <TableCell class="break-all">{{ row.label }}</TableCell>
              <TableCell class="text-right">{{ row.count }}</TableCell>
              <TableCell class="text-right">{{ row.rate }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  </EmailHealthBlock>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { storeToRefs } from "pinia";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import EmailHealthEmptyState from "@/components/email-health/EmailHealthEmptyState.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";
import type { DeliveryErrorEntry } from "@/contracts/emailHealth";

interface ErrorRow {
  date: string;
  label: string;
  count: string;
  rate: string;
}

const { t } = useI18n();
const store = useEmailHealthStore();
const { deliveryErrors, loading, errors } = storeToRefs(store);

const activeTab = ref("reject");

const loadingErrors = computed(() => loading.value.deliveryErrors);
const error = computed(() => errors.value.deliveryErrors);

interface FlatEntry {
  date: string;
  entry: DeliveryErrorEntry;
}

const flatEntries = computed<FlatEntry[]>(() => {
  const result: FlatEntry[] = [];
  for (const day of deliveryErrors.value?.series ?? []) {
    if (!day.available) continue;
    for (const entry of day.errors) {
      result.push({ date: day.metric_date, entry });
    }
  }
  return result.sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());
});

const hasAnyData = computed(() => flatEntries.value.length > 0);

function classifyV2(reason: string | null): "reject" | "temp_fail" | "other" {
  const normalized = (reason ?? "").toLowerCase().replace(/[-\s]/g, "_");
  if (normalized.startsWith("reject")) return "reject";
  if (normalized.startsWith("temp")) return "temp_fail";
  return "other";
}

const v2Entries = computed(() =>
  flatEntries.value.filter((item) => item.entry.source_version === "v2"),
);

const rejectRows = computed(() =>
  v2Entries.value.filter((item) => classifyV2(item.entry.error_reason) === "reject").map(toV2Row),
);

const tempFailRows = computed(() =>
  v2Entries.value.filter((item) => classifyV2(item.entry.error_reason) === "temp_fail").map(toV2Row),
);

const otherRows = computed(() =>
  v2Entries.value.filter((item) => classifyV2(item.entry.error_reason) === "other").map(toV2Row),
);

const v1Rows = computed(() =>
  flatEntries.value
    .filter((item) => item.entry.source_version === "v1")
    .map(({ date, entry }) => ({
      date: moment(date).format("DD/MM/YYYY"),
      label:
        [
          entry.error_class === "PERMANENT_ERROR"
            ? t("email_health.delivery_errors.permanent")
            : entry.error_class === "TEMPORARY_ERROR"
              ? t("email_health.delivery_errors.temporary")
              : null,
          entry.error_type,
        ]
          .filter(Boolean)
          .join(" — ") || "—",
      count: "—", // error_count é exclusivo da v2
      rate: formatRatio(entry.error_ratio),
    })),
);

function toV2Row({ date, entry }: FlatEntry): ErrorRow {
  return {
    date: moment(date).format("DD/MM/YYYY"),
    label: entry.error_reason ?? "—",
    count: entry.error_count !== null ? String(entry.error_count) : "—",
    rate: formatRatio(entry.error_ratio),
  };
}

function rowsFor(tab: string): ErrorRow[] {
  if (tab === "reject") return rejectRows.value;
  if (tab === "temp_fail") return tempFailRows.value;
  if (tab === "other") return otherRows.value;
  return v1Rows.value;
}

function formatRatio(value: number | null) {
  // null ≠ 0 — ausência de dado nunca é renderizada como 0%
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}
</script>
