<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="font-medium">{{ $t("groups_dre") }}</h3>
        <p class="text-xs text-muted-foreground">
          {{ $t("groups_dre_max_28_days") }}
        </p>
      </div>
      <CustomDatePicker v-model="selectedRange" />
    </div>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Skeleton v-for="n in 5" :key="n" class="h-20 w-full" />
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">
          {{ $t("groups_fin_revenue") }}
        </p>
        <p class="text-lg font-semibold">{{ formatCurrency(summary.revenue) }}</p>
      </div>
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">
          {{ $t("groups_fin_expense") }}
        </p>
        <p class="text-lg font-semibold">{{ formatCurrency(summary.expense) }}</p>
      </div>
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">
          {{ $t("groups_dre_investment") }}
        </p>
        <p class="text-lg font-semibold">{{ formatCurrency(summary.investment) }}</p>
      </div>
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">
          {{ $t("groups_dre_result") }}
        </p>
        <p class="text-lg font-semibold">{{ formatCurrency(summary.balance) }}</p>
      </div>
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">
          {{ $t("groups_fin_margin") }}
        </p>
        <p class="text-lg font-semibold">{{ summary.margin }}%</p>
      </div>
    </div>

    <FinancialDonutCharts
      :sector="charts.sector"
      :category="charts.category"
      :is-loading="loading"
    />

    <Card v-if="loading">
      <CardContent class="py-6">
        <Skeleton class="h-5 w-40" />
        <div class="mt-4 space-y-3">
          <Skeleton v-for="n in 3" :key="n" class="h-8 w-full" />
        </div>
      </CardContent>
    </Card>

    <Card v-else-if="origin">
      <CardHeader>
        <CardTitle>{{ $t("groups_dre_origin") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead class="text-right">
                {{ $t("groups_fin_revenue") }}
              </TableHead>
              <TableHead class="text-right">
                {{ $t("groups_fin_expense") }}
              </TableHead>
              <TableHead class="text-right">
                {{ $t("groups_dre_investment") }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{{ $t("groups_dre_origin_project") }}</TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(origin.project?.revenue) }}
              </TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(origin.project?.cost) }}
              </TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(origin.project?.investment) }}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{{ $t("groups_dre_origin_group") }}</TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(origin.group?.revenue) }}
              </TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(origin.group?.cost) }}
              </TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(origin.group?.investment) }}
              </TableCell>
            </TableRow>
            <TableRow class="font-semibold">
              <TableCell>{{ $t("groups_dre_origin_total") }}</TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(totalOrigin.revenue) }}
              </TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(totalOrigin.cost) }}
              </TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(totalOrigin.investment) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import FinancialDonutCharts from "@/components/financial/FinancialDonutCharts.vue";
import {
  getGroupFinancialDashboard,
  getGroupFinancials,
} from "@/services/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";
import type { GroupFinancialOriginBlock } from "@/contracts/groupFinancial";

const props = defineProps<{ group: Group }>();

const currentDate = today(getLocalTimeZone());
const selectedRange = ref<any>({
  start: currentDate.subtract({ days: 28 }),
  end: currentDate,
});

const summary = ref({ revenue: 0, expense: 0, balance: 0, margin: 0, investment: 0 });
const charts = ref<{ sector: any[]; category: any[] }>({ sector: [], category: [] });
const origin = ref<GroupFinancialOriginBlock | null>(null);
const loading = ref(false);

const rangeParams = computed(() => ({
  start_date: selectedRange.value.start?.toString(),
  end_date: selectedRange.value.end?.toString(),
}));

const totalOrigin = computed(() => {
  const project = origin.value?.project ?? {};
  const group = origin.value?.group ?? {};
  return {
    revenue: Number(project.revenue ?? 0) + Number(group.revenue ?? 0),
    cost: Number(project.cost ?? 0) + Number(group.cost ?? 0),
    investment: Number(project.investment ?? 0) + Number(group.investment ?? 0),
  };
});

function formatCurrency(value: unknown): string {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function reload() {
  loading.value = true;
  try {
    const [dashboard, financials] = await Promise.all([
      getGroupFinancialDashboard(props.group.id, rangeParams.value),
      getGroupFinancials(props.group.id, rangeParams.value),
    ]);
    summary.value = {
      revenue: dashboard.consolidated?.revenue ?? 0,
      expense: dashboard.consolidated?.expense ?? 0,
      balance: dashboard.consolidated?.balance ?? 0,
      margin: dashboard.consolidated?.margin_percentage ?? 0,
      investment: Number(financials.investimentos ?? 0),
    };
    charts.value = {
      sector: dashboard.charts?.expenses_by_sector ?? [],
      category: dashboard.charts?.expenses_by_category ?? [],
    };
    origin.value = financials.origin ?? null;
  } catch (error) {
    origin.value = null;
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
