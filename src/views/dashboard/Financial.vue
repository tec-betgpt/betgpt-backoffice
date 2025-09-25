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
          <CreateDialogComponent :costs="costs" :reload="fetchFinancials" />
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <Card>
        <CardContent class="pt-6">
          <div class="flex justify-end">
            <div class="flex w-full max-w-sm items-center gap-1.5">
              <Input v-model="search" type="search" placeholder="Buscar por descrição" />
              <Button type="submit" @click="fetchFinancials()">
                Buscar
              </Button>
            </div>
          </div>

          <Table class="w-full mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Centro de Custo
                </TableHead>
                <TableHead>
                  Categoria
                </TableHead>
                <TableHead>
                  <OrderButton
                    align="right"
                    label="Valor"
                    column="amount"
                    :orderId="orderId"
                    :order="order"
                    :onOrder="handlerOrder"
                  />
                </TableHead>

                <TableHead>
                  <OrderButton
                    align="right"
                    label="Data"
                    column="date"
                    :orderId="orderId"
                    :order="order"
                    :onOrder="handlerOrder"
                  />
                </TableHead>
                <TableHead class="text-right">
                  Descrição
                </TableHead>
                <TableHead>
                  <OrderButton
                    align="right"
                    label="Porcentagem"
                    column="percentage"
                    :orderId="orderId"
                    :order="order"
                    :onOrder="handlerOrder"
                  />
                </TableHead>
                <TableHead class="text-right">
                  Tipo
                </TableHead>
                <TableHead class="text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow v-if="loading" v-for="row in 7" :key="row">
                <TableCell v-for="col in 8" :key="col">
                  <Skeleton class="h-4 w-full bg-gray-300 my-4" />
                </TableCell>
              </TableRow>

              <transition-group
                v-else
                appear
                enter-active-class="enter-active"
                enter-from-class="enter"
                enter-to-class="enter-to"
              >
                <TableRow v-for="(row, index) in financial" :key="row.id" :style="`--delay: ${getMs(index)}`">
                  <TableCell>
                    {{ row.costCenter }}
                  </TableCell>
                  <TableCell>
                    {{ row.category_type === "fixed" ? "Fixa" : "Variavel" }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ toCurrency(Number.parseInt(row.amount)) }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ $moment(row.date).format("DD/MM/YYYY") }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ row.description }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ row.percentage ?? 0 }}%
                  </TableCell>
                  <TableCell class="text-right">
                    <Badge v-if="row.type === 'revenue'" class="bg-green-500 text-white">Receita</Badge>
                    <Badge v-else variant="outline" class="bg-red-500 text-white">Custo</Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 flex-nowrap">
                      <EditDialogComponent :reload="fetchFinancials" :row="row" :costs="costs" />
                      <DestroyDialogComponent :reload="fetchFinancials" :row="row" :destroy="deleteFinancial" />
                    </div>
                  </TableCell>
                </TableRow>
              </transition-group>
            </TableBody>
          </Table>
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
import FinancialTransaction from "@/services/financialTransactions";
import { toast } from "@/components/ui/toast";
import toCurrency from "@/filters/currencyFilter";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import CostCenter from "@/services/costCenters";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Skeleton} from "@/components/ui/skeleton";
import {Card, CardContent} from "@/components/ui/card";
import OrderButton from "@/components/custom/OrderButton.vue";
import CreateDialogComponent from "@/components/financial/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/financial/EditDialogComponent.vue";
import {Badge} from "@/components/ui/badge";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";

interface FinancialData {
  id: number;
  costCenter: string;
  cost_center_id: number;
  category_type: string;
  amount: string;
  date: string;
  description: string;
  percentage: string;
  type: string;
}

// data
const activeGroupProjectId = useWorkspaceStore().activeGroupProject?.id ?? null;
const search = ref(null);
const orderId = ref("name");
const order = ref(false);
const perPage = ref("10");
const costs = ref([]);
const financial = ref<FinancialData[]>([]);
const loading = ref(true);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

// methods
const deleteFinancial = async (id: number) => {
  try {
    await FinancialTransaction.destroy(id)
    await fetchFinancials();

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

const fetchFinancials = async (current = pages.value.current) => {
  try {
    const { data } = await FinancialTransaction.index({
      page: current,
      filter_id: activeGroupProjectId,
      name: search.value,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
      per_page:perPage.value,
    })

    financial.value = data.data.map((financial) => ({
      id: financial.id,
      costCenter: financial.cost_center.name,
      cost_center_id: financial.cost_center_id,
      category_type: financial.category_type,
      amount: financial.amount,
      date: financial.date,
      description: financial.description,
      percentage: financial.percentage,
      type: financial.type,
    }));

    pages.value = {
      current: data.current_page,
      total: data.total,
      last: data.last_page,
    };
  } catch (error) {
    console.error("Erro ao buscar transações financeiras:", error);
  }
}

const getCosts = async () => {
  try {
    const { data } = await CostCenter.index({ filter_id: activeGroupProjectId })

    costs.value = data.data.map((cost: any) => ({
      id: cost.id,
      name: cost.name,
      sector: cost.sector.name,
    }));
  } catch (error) {
    console.error("Erro ao buscar centros de custo:", error);
  }
}

const getMs = (num: number): string => {
  return (num / 10).toFixed(1) + "s";
}

const handlerOrder = (column: string, direction: boolean) => {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }

  fetchFinancials();
}

// hooks
onMounted(async () => {
  loading.value = true;

  await getCosts();
  await fetchFinancials();

  loading.value = false;
});

watch(perPage,() => {
  fetchFinancials(1);
})
</script>
