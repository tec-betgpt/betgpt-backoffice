<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 pb-10">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Gerenciamento Financeiro</h2>
        <p class="text-muted-foreground">
          Adicione e gerencie custos, receitas e métricas financeiras para
          melhorar o controle do seu orçamento.
        </p>
      </div>
      <div class="flex items-center justify-start w-full">
        <div class="flex flex-col items-center justify-end sm:flex-row gap-2 w-full">
          <CreateDialogComponent :costs="costs" :sectors="sectors" :reload="reloadFinancialsAfterMutation" />
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <Card>
        <CardContent class="pt-6">
          <FinancialTransactionsTable
            :transactions="financial"
            :is-loading="loading"
            :search="search"
            :global-totals="globalTotals"
            :on-search="() => fetchFinancials(1)"
            :on-update-search="(value) => search = value"
            :on-open-import-dialog="openImportDialog"
            :reload-financials-after-mutation="reloadFinancialsAfterMutation"
            :delete-financial="deleteFinancial"
            :costs="costs"
            :sectors="sectors"
          />
        </CardContent>
      </Card>

      <CustomPagination
        :select-page="fetchFinancials"
        :pages="pages"
        :per_pages="perPage"
        @update:perPages="(valueUpdater) => perPage = valueUpdater"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import financialTransactionsApi from "@/services/financialTransactions";
import { toast } from "@/components/ui/toast";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import CostCenter from "@/services/costCenters";
import Sector from "@/services/sector";
import {Card, CardContent} from "@/components/ui/card";
import CreateDialogComponent from "@/components/financial/CreateDialogComponent.vue";
import FinancialTransactionsTable from "@/components/financial/FinancialTransactionsTable.vue";

interface FinancialData {
  id: number;
  costCenter: string;
  cost_center_id: number | null;
  sectorId: number | null;
  sectorName: string;
  category_type: string;
  amount: string;
  date: string;
  description: string;
  percentage: string;
  type: string;
  createdByName: string;
}

interface FinancialGlobalTotals {
  total_revenue: number;
  total_expense: number;
  balance: number;
}

// data
const activeGroupProjectId = useWorkspaceStore().activeGroupProject?.id ?? null;
const search = ref("");
const orderId = ref("name");
const order = ref(false);
const perPage = ref("10");
const costs = ref<
  { id: number; name: string; sector: string; sector_id: number }[]
>([]);
const sectors = ref<{ id: number; name: string }[]>([]);
const financial = ref<FinancialData[]>([]);
const loading = ref(true);
const globalTotals = ref<FinancialGlobalTotals>({
  total_revenue: 0,
  total_expense: 0,
  balance: 0,
});
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

const reloadFinancialsAfterMutation = () =>
  fetchFinancials(pages.value.current, { refresh: true });

const openImportDialog = () => {
  console.log("Abrir modal de importação de tabela financeira");
};

// methods
const deleteFinancial = async (id: number) => {
  try {
    await financialTransactionsApi.destroy(id);
    await fetchFinancials(pages.value.current, { refresh: true });

    toast({
      title: "Removido com sucesso!",
      description: `Transação financeira foi excluída.`,
    });
  } catch (error) {
    toast({
      title: "Erro ao remover item",
      description: "Tente novamente mais tarde.",
      variant: "destructive",
    });
  }
}

const fetchFinancials = async (
  current = pages.value.current,
  opts?: { refresh?: boolean },
) => {
  try {
    const response = await financialTransactionsApi.index({
      page: current,
      filter_id: activeGroupProjectId,
      name: search.value,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
      per_page: perPage.value,
      ...(opts?.refresh ? { refresh: 1 } : {}),
    });

    const data = response.data
    const meta = response.meta

    financial.value = data.map((financial: any) => {
      const u = financial.user;
      const createdByName = u
        ? [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || "—"
        : "—";
      const sector = financial.sector ?? financial.cost_center?.sector;
      return {
        id: financial.id,
        costCenter: financial.cost_center?.name ?? "—",
        cost_center_id: financial.cost_center_id ?? null,
        sectorId: sector?.id ?? financial.sector_id ?? null,
        sectorName: sector?.name ?? "—",
        category_type: financial.category_type,
        amount: financial.amount,
        date: financial.date,
        description: financial.description,
        percentage: financial.percentage,
        type: financial.type,
        createdByName,
      };
    });

    globalTotals.value = meta.global_totals ?? {
      total_revenue: 0,
      total_expense: 0,
      balance: 0,
    };

    pages.value = {
      current: meta.current_page,
      total: meta.total,
      last: meta.last_page,
    };
  } catch (error) {
    console.error("Erro ao buscar transações financeiras:", error);
  }
}

const getCosts = async () => {
  try {
    const { data } = await CostCenter.index({
      filter_id: activeGroupProjectId,
      per_page: 500,
      sort_by: "name",
      sort_order: "asc",
    });

    costs.value = data.data.map((cost: any) => ({
      id: cost.id,
      name: cost.name,
      sector: cost.sector?.name ?? "",
      sector_id: cost.sector_id ?? cost.sector?.id,
    }));
  } catch (error) {
    console.error("Erro ao buscar centros de custo:", error);
  }
}

const getSectors = async () => {
  try {
    const { data } = await Sector.index({
      filter_id: activeGroupProjectId,
      per_page: 500,
      sort_by: "name",
      sort_order: "asc",
    });
    sectors.value = (data.data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }));
  } catch (error) {
    console.error("Erro ao buscar setores:", error);
  }
};

// hooks
onMounted(async () => {
  loading.value = true;

  await getCosts();
  await getSectors();
  await fetchFinancials();

  loading.value = false;
});

useScreenContext(
  "Tela financeiro - Gerencia informações financeiras",
  () => ({
    "Período": search.value || "Não selecionado",
    "Ordenação": orderId.value || "Padrão",
    "Direção": order.value ? "Crescente" : "Decrescente",
    "Página atual": pages.value.current,
    "Total de páginas": pages.value.last,
    "Itens por página": perPage.value,
  })
);

watch(perPage,() => {
  fetchFinancials(1);
})
</script>
