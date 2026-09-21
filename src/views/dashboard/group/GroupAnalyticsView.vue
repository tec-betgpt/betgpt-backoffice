<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="font-medium">{{ $t("groups_analytics") }}</h3>
      <CustomDatePicker v-model="selectedRange" />
    </div>

    <div v-if="!isLoading && !periods.length" class="py-10 text-center text-sm text-muted-foreground">
      {{ $t("groups_analytics_empty") }}
    </div>

    <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <PeriodComponent
        v-for="item in periods"
        :key="item.chartName"
        :chart-name="undefined"
        :period="(item.period as any)"
        :title="item.title"
        :type="item.type"
        :percent-decimals="2"
        :glossary="item.glossary"
        :is-loading="isLoading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { today, getLocalTimeZone } from "@internationalized/date";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";
import { getGroupAnalytics } from "@/services/groups";
import { mapAnalyticsResponse } from "@/composables/useConsolidatedAnalytics";
import type { ConsolidatedAnalyticsPeriod } from "@/composables/useConsolidatedAnalytics";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";

const props = defineProps<{ group: Group }>();

const currentDate = today(getLocalTimeZone());
const selectedRange = ref<any>({
  start: currentDate.subtract({ days: 28 }),
  end: currentDate,
});
const periods = ref<ConsolidatedAnalyticsPeriod[]>([]);
const isLoading = ref(true);

async function reload() {
  isLoading.value = true;
  try {
    const data = await getGroupAnalytics<Record<string, unknown>>(
      props.group.id,
      {
        start_date: selectedRange.value.start?.toString(),
        end_date: selectedRange.value.end?.toString(),
      },
    );
    periods.value = mapAnalyticsResponse(data);
  } catch (error) {
    periods.value = [];
    showApiErrorToast(error);
  } finally {
    isLoading.value = false;
  }
}

watch(selectedRange, reload, { deep: true });
watch(
  () => props.group.id,
  () => reload(),
);
onMounted(reload);
</script>
