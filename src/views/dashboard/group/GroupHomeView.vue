<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="font-medium">{{ $t("groups_home") }}</h3>
      <CustomDatePicker v-model="selectedRange" />
    </div>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton v-for="n in 4" :key="n" class="h-24 w-full" />
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in cards"
        :key="card.label"
        class="rounded-lg border p-4"
      >
        <p class="text-xs text-muted-foreground">{{ card.label }}</p>
        <p class="mt-1 text-xl font-semibold">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Skeleton } from "@/components/ui/skeleton";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import { getGroupHome } from "@/services/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";

const props = defineProps<{ group: Group }>();

const { t } = useI18n();
const currentDate = today(getLocalTimeZone());
const selectedRange = ref<any>({
  start: currentDate.subtract({ days: 28 }),
  end: currentDate,
});

const home = ref<any>(null);
const loading = ref(true);

const cards = computed(() => [
  {
    label: t("groups_consolidated_players"),
    value: home.value?.players?.count ?? "—",
  },
  {
    label: t("groups_home_active_now"),
    value: home.value?.active_now?.count ?? "—",
  },
  {
    label: t("groups_fin_revenue"),
    value: home.value?.deposits?.total ?? "—",
  },
  {
    label: t("groups_fin_expense"),
    value: home.value?.withdraws?.total ?? "—",
  },
]);

async function reload() {
  loading.value = true;
  try {
    home.value = await getGroupHome(props.group.id, {
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
    });
  } catch (error) {
    home.value = null;
    showApiErrorToast(error);
  } finally {
    loading.value = false;
  }
}

watch(selectedRange, reload, { deep: true });
watch(
  () => props.group.id,
  () => reload(),
);
onMounted(reload);
</script>
