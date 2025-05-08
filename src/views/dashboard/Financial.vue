<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">
        Gerenciamento Financeiro
      </h2>
      <p class="text-muted-foreground">
        Adicione e gerencie custos, receitas e métricas financeiras para
        melhorar o controle do seu orçamento.
      </p>
    </div>
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomDataTable
            :loading="loadingFinancials"
            :data="financial"
            :columns="columns"
            :find="fetchFinancials"
            :update-text="handleFinancialName"
            :search-fields="[
              {
                key: 'description',
                label: '',
                placeholder: 'Buscar por descrição...',
              },
            ]"
          />
          <CustomPagination :select-page="fetchFinancials" :pages="pages" />
        </CardContent>
        <CardFooter class="flex justify-start">
          <Button @click="openSheet('financeiro')">Novo Registro</Button>
        </CardFooter>
      </Card>
    </div>
  </div>

  <Sheet v-model:open="showModal">
    <SheetContent position="right" size="lg">
      <SheetHeader>
        <SheetTitle>
          {{ isEditing ? `Editar ${form.type}` : `Novo ${form.type}` }}
        </SheetTitle>
        <SheetDescription>
          {{
            isEditing
              ? `Edite as informações do ${form.type}.`
              : `Crie um novo ${form.type}.`
          }}
        </SheetDescription>
      </SheetHeader>

      <form @submit.prevent="submitFinancial()">
        <div class="grid gap-4 py-4">
          <template v-if="form.type === 'financeiro'">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="cost_center_id">Centro de Custo</Label>
              <Select v-model="financialForm.cost_center_id">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione um centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="cost in costs"
                    :key="cost.id"
                    :value="cost.id"
                  >
                    {{ cost.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="type">Tipo</Label>
              <Select v-model="financialForm.type">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost">Custo</SelectItem>
                  <SelectItem value="revenue">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="category_type">Categoria</Label>
              <Select v-model="financialForm.category_type">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo</SelectItem>
                  <SelectItem value="variable">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="percentage">Porcentagem (%)</Label>
              <Input
                id="percentage"
                v-model="financialForm.percentage"
                type="number"
                placeholder="Opcional"
                class="col-span-3"
                min="0"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="amount">Valor</Label>
              <Input
                id="amount"
                v-model="financialForm.amount"
                type="number"
                placeholder="Digite o valor"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="description">Descrição</Label>
              <Input
                id="description"
                v-model="financialForm.description"
                placeholder="Digite uma descrição"
                class="col-span-3"
              />
            </div>
          </template>
        </div>

        <SheetFooter>
          <Button type="submit" :disabled="loadingSub">
            <LucideSpinner
              v-if="loadingSub"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ loadingSub ? "Salvando..." : isEditing ? "Salvar" : "Criar" }}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { Button } from "@/components/ui/button";
import { createColumnHelper } from "@tanstack/vue-table";
import { h, onMounted, ref, watch } from "vue";
import FinancialTransaction from "@/services/financialTransactions";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { toast } from "@/components/ui/toast";
import { MoreHorizontal, ArrowDown, ArrowUp } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import moment from "moment/moment";
import toCurrency from "@/filters/currencyFilter";
import { createHeaderButton } from "@/components/custom/CustomHeaderButton";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import CostCenter from "@/services/costCenters";

const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
interface FinancialData {
  id: number;
  costCenter: string;
  category_type: string;
  amount: string;
  date: string;
  description: string;
  percentage: string;
  type: string;
}
const loadingRemove = ref(false);
function handlerOrder(column: string, direction: boolean) {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }
  fetchFinancials();
}
const columnHelper = createColumnHelper<FinancialData>();
const columns = [
  columnHelper.accessor("id", {
    header({ column }) {
      return createHeaderButton(
        "ID",
        "id",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) => h("div", {}, row.getValue("id")),
  }),
  columnHelper.accessor("costCenter", {
    header: "Centro de Custo",
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, row.getValue("costCenter")),
  }),
  columnHelper.accessor("category_type", {
    header: "Categoria",
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        row.getValue("category_type") == "fixed" ? "Fixa" : "Variavel"
      ),
  }),
  columnHelper.accessor("amount", {
    header({ column }) {
      return createHeaderButton(
        "Valor",
        "value",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) =>
      h("div", {}, toCurrency(Number.parseInt(row.getValue("amount")))),
  }),
  columnHelper.accessor("date", {
    header({ column }) {
      return createHeaderButton(
        "Data",
        "date",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) =>
      h("div", {}, moment(row.getValue("date")).format("DD/MM/YYYY")),
  }),
  columnHelper.accessor("description", {
    header: "Descrição",
    cell: ({ row }) => h("div", {}, row.getValue("description")),
  }),
  columnHelper.accessor("percentage", {
    header({ column }) {
      return createHeaderButton(
        "Porcentagem",
        "percentage",
        orderId.value,
        order.value,
        handlerOrder
      );
    },

    cell: ({ row }) =>
      h(
        "div",
        {},
        `${row.getValue("percentage") ? row.getValue("percentage") : "0"}%`
      ),
  }),
  columnHelper.accessor("type", {
    header: "Tipo",
    cell: ({ row }) =>
      h("div", {}, row.getValue("type") == "revenue" ? "Receita" : "Custo"),
  }),
  columnHelper.display({
    id: "actions",
    header({ column }) {
      return "Ações";
    },
    cell: ({ row }) =>
      h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(
            Button,
            {
              "aria-haspopup": "true",
              size: "icon",
              variant: "ghost",
              disabled: loadingRemove.value || loading.value,
            },
            [
              h(MoreHorizontal, { class: "h-4 w-4" }),
              h("span", { class: "sr-only" }, "Ações"),
            ]
          )
        ),
        h(DropdownMenuContent, { align: "end" }, [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),
          h(
            DropdownMenuItem,
            {
              onClick: () => {
                const item = row.original;
                handleEdit(item, "financeiro"); // Função para abrir o modal de edição
              },
            },
            "Editar"
          ),
          h(
            DropdownMenuItem,
            {
              onClick: () => {
                const itemId = row.original.id;
                deleteFinancial(itemId); // Função para remover o item pelo ID
              },
            },
            h("div", { class: "flex items-center" }, "Remover")
          ),
        ]),
      ]),
  }),
];

const form = ref({ type: "" });
const financialForm = ref({});
const orderId = ref("name");
const order = ref(false);
const openSheet = (type) => {
  form.value.type = type;
  isEditing.value = false;
  financialForm.value = {
    id: null,
    cost_center_id: null,
    type: "",
    category_type: "",
    percentage: null,
    amount: null,
    date: "",
    description: "",
    user_id: null,
  };
  showModal.value = true;
};

const handleEdit = (item, type) => {
  form.value.type = type;
  isEditing.value = true;
  financialForm.value = {
    id: item.id,
    cost_center_id: item.cost_center_id || null,
    type: item.type || "",
    category_type: item.category_type || "",
    percentage: item.percentage || 0,
    amount: item.amount || null,
    date: item.date || "",
    description: item.description || "",
    user_id: item.user_id || null,
  };

  showModal.value = true;
};

const deleteFinancial = async (id: number) => {
  loading.value = true;

  try {
    await FinancialTransaction.destroy(id)
    toast({
      title: "Transação financeira deletada com sucesso!",
      description: `A transação financeira com ID ${id} foi removida.`,
      variant: "success",
    });
    await fetchFinancials();
  } catch (error) {
    console.error("Erro ao deletar transação financeira:", error);
    toast({
      title: "Erro ao deletar transação financeira",
      description:
        "Não foi possível remover a transação financeira. Tente novamente.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

const submitFinancial = async () => {
  loadingSub.value = true;

  try {
    if (isEditing.value) {
      await FinancialTransaction.update(financialForm.value.id, financialForm.value)
    } else {
      await FinancialTransaction.store(financialForm.value)
    }
    showModal.value = false;
  } catch (error) {
    console.error("Erro ao salvar transação financeira:", error);
  }

  await fetchFinancials();
  loadingSub.value = false;
};

const loadingSub = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const costs = ref([]);
const financial = ref([]);
const loadingCosts = ref(true);
const loadingFinancials = ref(true);
const loading = ref(true);
const fetchCosts = async () => {
  loadingCosts.value = true;

  try {
    const { data } = await CostCenter.index({ filter_id: activeGroupProjectId })

    costs.value = data.data.map((cost) => ({
      id: cost.id,
      name: cost.name,
      sector: cost.sector.name,
    }));
  } catch (error) {
    console.error("Erro ao buscar centros de custo:", error);
  }

  loadingCosts.value = false;
};
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const fetchFinancials = async (current = pages.value.current) => {
  loadingFinancials.value = true;

  try {
    const { data } = await FinancialTransaction.index({
      page: current,
      filter_id: activeGroupProjectId,
      name: nameFinancial.value,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
    })

    financial.value = data.data.map((financial) => ({
      id: financial.id,
      costCenter: financial.cost_center.name,
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

  loadingFinancials.value = false;
};
onMounted(async () => {
  await fetchCosts();
  await fetchFinancials();
});

const nameFinancial = ref();
const handleFinancialName = (text: string) => {
  nameFinancial.value = text;
};
</script>
