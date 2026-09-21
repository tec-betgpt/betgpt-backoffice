<template>
  <div class="space-y-4">
    <Card>
      <CardContent class="space-y-4 py-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="font-medium">{{ $t("groups_financial") }}</h3>
          <div class="flex items-center gap-2">
            <CustomDatePicker v-model="selectedRange" />
            <Button
              v-if="permissions.canEdit"
              @click="openCreate"
            >
              {{ $t("groups_fin_new") }}
            </Button>
          </div>
        </div>

        <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton v-for="n in 4" :key="n" class="h-20 w-full" />
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              {{ $t("groups_fin_balance") }}
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
      </CardContent>
    </Card>

    <FinancialDonutCharts
      :sector="charts.sector"
      :category="charts.category"
      :is-loading="loading"
    />

    <Card>
      <CardContent class="space-y-4 py-4">
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t("groups_fin_date") }}</TableHead>
              <TableHead>{{ $t("groups_fin_type") }}</TableHead>
              <TableHead>{{ $t("groups_fin_category") }}</TableHead>
              <TableHead>{{ $t("groups_fin_description") }}</TableHead>
              <TableHead class="text-right">
                {{ $t("groups_fin_amount") }}
              </TableHead>
              <TableHead class="text-right">{{ $t("groups_cancel") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="loading">
            <TableRow v-for="n in 5" :key="n">
              <TableCell colspan="6">
                <Skeleton class="h-6 w-full" />
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else-if="transactions.length">
            <TableRow v-for="row in transactions" :key="row.id">
              <TableCell>{{ formatDate(row.date) }}</TableCell>
              <TableCell>{{ $t(`groups_fin_type_${row.type}`) }}</TableCell>
              <TableCell>{{ row.category_type || "—" }}</TableCell>
              <TableCell>{{ row.description || "—" }}</TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(Number(row.amount)) }}
              </TableCell>
              <TableCell class="text-right">
                <template v-if="permissions.canEdit">
                  <Button variant="ghost" size="sm" @click="openEdit(row)">
                    {{ $t("groups_edit") }}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive"
                    @click="remove(row)"
                  >
                    {{ $t("groups_remove") }}
                  </Button>
                </template>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else>
            <TableRow>
              <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">
                {{ $t("groups_fin_empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <GroupFinancialTransactionDialog
      v-model:open="dialogOpen"
      :group-id="group.id"
      :transaction="editing"
      @saved="reload"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import GroupFinancialTransactionDialog from "@/components/groups/GroupFinancialTransactionDialog.vue";
import FinancialDonutCharts from "@/components/financial/FinancialDonutCharts.vue";
import {
  deleteGroupFinancialTransaction,
  getGroupFinancialDashboard,
  listGroupFinancialTransactions,
} from "@/services/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";
import type {
  GroupFinancialTransaction,
} from "@/contracts/groupFinancial";

const props = defineProps<{ group: Group; permissions: GroupPermissions }>();

const { t } = useI18n();
const currentDate = today(getLocalTimeZone());

const selectedRange = ref<any>({
  start: currentDate.subtract({ days: 28 }),
  end: currentDate,
});
const transactions = ref<GroupFinancialTransaction[]>([]);
const summary = ref({ revenue: 0, expense: 0, balance: 0, margin: 0 });
const charts = ref<{ sector: any[]; category: any[] }>({
  sector: [],
  category: [],
});
const loading = ref(false);
const dialogOpen = ref(false);
const editing = ref<GroupFinancialTransaction | null>(null);

const rangeParams = computed(() => ({
  start_date: selectedRange.value.start?.toString(),
  end_date: selectedRange.value.end?.toString(),
}));

function formatCurrency(value: number): string {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function openCreate() {
  editing.value = null;
  dialogOpen.value = true;
}

function openEdit(row: GroupFinancialTransaction) {
  editing.value = row;
  dialogOpen.value = true;
}

async function remove(row: GroupFinancialTransaction) {
  if (!window.confirm(t("groups_confirm_delete_description"))) return;
  try {
    await deleteGroupFinancialTransaction(props.group.id, row.id);
    toast(t("groups_fin_deleted"));
    await reload();
  } catch (error) {
    showApiErrorToast(error);
  }
}

async function reload() {
  loading.value = true;
  try {
    const [list, dashboard] = await Promise.all([
      listGroupFinancialTransactions(props.group.id, {
        ...rangeParams.value,
        per_page: 50,
      }),
      getGroupFinancialDashboard(props.group.id, rangeParams.value),
    ]);
    transactions.value = list.data ?? [];
    summary.value = {
      revenue: dashboard.consolidated?.revenue ?? 0,
      expense: dashboard.consolidated?.expense ?? 0,
      balance: dashboard.consolidated?.balance ?? 0,
      margin: dashboard.consolidated?.margin_percentage ?? 0,
    };
    charts.value = {
      sector: dashboard.charts?.expenses_by_sector ?? [],
      category: dashboard.charts?.expenses_by_category ?? [],
    };
  } catch (error) {
    showApiErrorToast(error);
  } finally {
    loading.value = false;
  }
}

watch(rangeParams, reload);
watch(
  () => props.group.id,
  () => reload(),
);
onMounted(reload);
</script>
