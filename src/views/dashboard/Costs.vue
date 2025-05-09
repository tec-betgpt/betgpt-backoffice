<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciamento de Custos</h2>
      <p class="text-muted-foreground">
        Gerencie os centros de custo financeiros, adicionando ou editando
        informações para otimizar o controle e organização do orçamento.
      </p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Custos</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomDataTable
          :data="costs"
          :columns="columns"
          :loading="loadingCosts"
          :find="fetchCosts"
          :update-text="handleText"
          :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
      </CardContent>
      <CustomPagination :select-page="fetchCosts" :pages="pages" />
      <CardFooter>
        <Button @click="openSheet()">Criar Custo</Button>
      </CardFooter>
    </Card>

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
        <form @submit.prevent="submitCost">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Categoria</Label>
              <div class="col-span-3">
                <Select v-model="costForm.name">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marketing e Vendas"
                      >Marketing e Vendas</SelectItem
                    >
                    <SelectItem value="Pessoal">Pessoal</SelectItem>
                    <SelectItem value="Administrativas"
                      >Administrativas</SelectItem
                    >
                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  v-if="costForm.name === 'Outros'"
                  v-model="costForm.otherName"
                  placeholder="Digite o nome"
                  class="mt-2"
                />
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="sector_id">Setor</Label>
              <Select v-model="costForm.sector_id">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="sector in sectors"
                    :key="sector.id"
                    :value="sector.id"
                  >
                    {{ sector.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" :disabled="loadingSub">
              {{ loadingSub ? "Salvando..." : isEditing ? "Salvar" : "Criar" }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted } from "vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { createColumnHelper } from "@tanstack/vue-table";
import { MoreHorizontal, ArrowDown, ArrowUp } from "lucide-vue-next";
import CostCenter from '@/services/costCenters'
import { toast } from "@/components/ui/toast";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { createHeaderButton } from "@/components/custom/CustomHeaderButton";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import Sector from "@/services/sector"

// Alinhando a interface com o que usamos no ManagerFinancial.vue
interface CostData {
  id: number;
  name: string;
  sector: string;
}

const loadingCosts = ref(true);
const loadingRemove = ref(false);
const costs = ref<CostData[]>([]);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const columnHelper = createColumnHelper<CostData>();
const loadingSectors = ref(true);
const showModal = ref(false);
const nameCost = ref();
const orderId = ref("");
const order = ref(false);
const form = ref({ type: "" });
const isEditing = ref(false);
const costForm = ref({});
const loadingSub = ref(false);
const showSuccessToast = (title: string, description: string) => {
  toast({ title, description, variant: "default" });
};

const showErrorToast = (title: string, description: string) => {
  toast({ title, description, variant: "destructive" });
};
function handlerOrder(column: string, direction: boolean) {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }
  fetchCosts();
}

const fetchCosts = async (current: number = pages.value.current) => {
  loadingCosts.value = true;

  try {
    const page = nameCost.value && current
        ? current
        : nameCost.value
            ? 1
            : current
                ? current
                : pages.value.current

    const { data } = await CostCenter.index({
      filter_id: activeGroupProjectId,
      find_name: nameCost.value,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
      page,
    })

    costs.value = data.data.map((cost) => ({
      id: cost.id,
      name: cost.name,
      sector: cost.sector.name,
    }));
    pages.value = {
      current: data.current_page,
      total: data.total,
      last: data.last_page,
    };
  } catch (error) {
    console.error("Erro ao buscar centros de custo:", error);
  } finally {
    loadingCosts.value = false;
  }
};
const handleEdit = (item: CostData) => {
  form.value.type = "custor";
  isEditing.value = true;
  costForm.value = { ...item };
  showModal.value = true;
};

const deleteCost = async (id: number) => {
  try {
    loadingRemove.value = true;
    await CostCenter.destroy(id)
    showSuccessToast("Custo deletado", `O custo com ID ${id} foi removido.`);
    await fetchCosts();
  } catch (error) {
    console.error("Erro ao deletar custo:", error);
    showErrorToast(
      "Erro ao remover custo",
      "Não foi possível remover o custo."
    );
  }

  loadingRemove.value = false;
};

const submitCost = async () => {
  try {
    loadingSub.value = true;
    if (isEditing.value) {
      await CostCenter.update(costForm.value.id, costForm.value)
    } else {
      await CostCenter.store(costForm.value)
    }
    showModal.value = false;
  } catch (error) {
    console.error("Erro ao salvar centro de custo:", error);
  } finally {
    loadingSub.value = false;
    await fetchCosts();
  }
};

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const columns = [
  columnHelper.accessor("id", {
    header({}) {
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
  columnHelper.accessor("name", {
    header({}) {
      return createHeaderButton(
        "Nome",
        "name",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("sector", {
    header: "Setor",
    cell: ({ row }) => h("div", {}, row.getValue("sector")),
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
              disabled: loadingRemove.value,
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
                handleEdit(item, "custo"); // Função para abrir o modal de edição
              },
            },
            "Editar"
          ),
          h(
            DropdownMenuItem,
            {
              onClick: () => {
                const itemId = row.original.id;
                deleteCost(itemId); // Função para remover o item pelo ID
              },
            },
            h("div", { class: "flex items-center" }, "Remover")
          ),
        ]),
      ]),
  }),
];
const applyFilter = async () => {
  loadingSectors.value = true;
  await fetchCosts();
  await fetchSectors();
  loadingSectors.value = false;
};

const sectors = ref([]);
const openSheet = () => {
  form.value.type = "custo";
  isEditing.value = false;
  costForm.value = { name: "", user_id: null };
  showModal.value = true;
};
const fetchSectors = async () => {
  loadingSectors.value = true;

  try {
    const { data } = await Sector.index({
      filter_id: activeGroupProjectId,
    })

    sectors.value = data.data.map((sector: any) => ({
      id: sector.id,
      name: sector.name,
    }));
  } catch (error) {
    console.error("Erro ao buscar setores:", error);
  }

  loadingSectors.value = false;
};

const handleText = (text: string) => {
  nameCost.value = text;
};

onMounted(async () => {
  await applyFilter();
});
</script>
