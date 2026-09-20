<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="font-medium">{{ $t("groups_consolidated") }}</h3>
        <CustomDatePicker v-model="selectedRange" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="card in cards"
          :key="card.label"
          class="rounded-lg border p-3"
        >
          <p class="text-xs text-muted-foreground">{{ card.label }}</p>
          <p class="text-lg font-semibold">{{ card.value }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Card, CardContent } from "@/components/ui/card";
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

const cards = computed(() => [
  {
    label: t("groups_consolidated_players"),
    value: home.value?.players?.count ?? "—",
  },
  {
    label: t("groups_consolidated_players") + " (ativos)",
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
  try {
    home.value = await getGroupHome(props.group.id, {
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
    });
  } catch (error) {
    home.value = null;
    showApiErrorToast(error);
  }
}

watch(selectedRange, reload, { deep: true });
onMounted(reload);
</script>
