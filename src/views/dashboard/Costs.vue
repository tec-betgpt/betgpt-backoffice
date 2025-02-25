<script setup lang="ts">
import {h, ref, onMounted, watch} from "vue";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowDown, ArrowUp } from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import api from "@/services/api";
import { toast } from "@/components/ui/toast";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import {createHeaderButton} from "@/components/custom/CustomHeaderButton";

// Alinhando a interface com o que usamos no ManagerFinancial.vue
interface CostData{
  id: number;
  name: string;
  sector: string;
}

const loadingCosts = ref(true);
const loadingRemove = ref(false);
const costs = ref<CostData[]>([]);

const columnHelper = createColumnHelper<CostData>();
const loadingSectors = ref(true);
const showModal = ref(false);
const projectFilters = ref([]);
const selectedFilterId = ref<number | null>(null);
const nameCost = ref('');
const orderId = ref('');
const order = ref(false);
const form = ref({ type: '' });
const isEditing = ref(false);
const costForm = ref({ });
const loadingSub = ref(false);
const showSuccessToast = (title: string, description: string) => {
  toast({ title, description, variant: "default" });
};

const showErrorToast = (title: string, description: string) => {
  toast({ title, description, variant: "destructive" });
};
function handlerOrder(column:string,direction:boolean,){
  if (column) {
    orderId.value = column;
    order.value = direction
  }
  fetchCosts();
}


const fetchCosts = async (current:number= pages.value.current) => {

  try {
    loadingCosts.value = true;
    const response = await api.get(`/financial/cost-centers?page=${nameCost.value && current ? current : nameCost.value ? 1 : current ? current : pages.value.current}`,
        {params: {
            filter_id: selectedFilterId.value,
            find_name: nameCost.value,
            sort_by: orderId.value,
            sort_order: order.value ? 'asc' : 'desc'
        }});
    costs.value = response.data.data.data.map(cost =>
        (
            {id:cost.id,name:cost.name,sector:cost.sector.name}
        ))
    pages.value = {
      current: response.data.data.current_page,
      total: response.data.data.total,
      last: response.data.data.last_page,
    };
  } catch (error) {
    console.error('Erro ao buscar centros de custo:', error);
  } finally {
    loadingCosts.value = false;
  }
};
const handleEdit = (item: CostData) => {
  form.value.type = 'custor';
  isEditing.value = true;
  costForm.value = { ...item };
  showModal.value = true;
};

const deleteCost = async (id: number) => {
  try {
    loadingRemove.value = true;
    await api.delete(`/financial/cost-centers/${id}`);
    showSuccessToast("Custo deletado", `O custo com ID ${id} foi removido.`);
    await fetchCosts();
  } catch (error) {
    console.error("Erro ao deletar custo:", error);
    showErrorToast("Erro ao remover custo", "Não foi possível remover o custo.");
  } finally {
    loadingRemove.value = false;
  }
};
const submitCost = async () => {
  try {
    loadingSub.value = true;
    if (isEditing.value) {
      await api.put(`/financial/cost-centers/${costForm.value.id}`, costForm.value);
    } else {
      console.log(costForm.value);
      await api.post('/financial/cost-centers', costForm.value);
    }
    showModal.value = false;
  } catch (error) {
    console.error('Erro ao salvar centro de custo:', error);
  } finally {
    loadingSub.value = false;
    await fetchCosts();
  }
};
watch(selectedFilterId,()=>{
  fetchCosts();
})
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const columns = [
  columnHelper.accessor('id', {
    header({}){ return createHeaderButton('ID', 'id',orderId.value,order.value,handlerOrder)},
    cell: ({row}) => h('div', {}, row.getValue('id')),
  }),
  columnHelper.accessor('name', {
    header({}){ return createHeaderButton('Nome', 'name',orderId.value,order.value,handlerOrder)},
    cell: ({row}) => h('div', {class: 'capitalize'}, row.getValue('name')),
  }),
  columnHelper.accessor('sector', {
    header: 'Setor',
    cell: ({row}) => h('div', {}, row.getValue('sector')),
  }),
  columnHelper.display({
    id: "actions",
    header({column}) {
      return "Ações";
    },
    cell: ({row}) =>
        h(DropdownMenu, {}, [
          h(
              DropdownMenuTrigger,
              {asChild: true},
              h(
                  Button,
                  {
                    "aria-haspopup": "true",
                    size: "icon",
                    variant: "ghost",
                    disabled: loadingRemove.value ,
                  },
                  [
                    h(MoreHorizontal, {class: "h-4 w-4"}),
                    h("span", {class: "sr-only"}, "Ações"),
                  ]
              )
          ),
          h(DropdownMenuContent, {align: "end"}, [
            h(DropdownMenuLabel, {}, "Ações"),
            h(DropdownMenuSeparator, {}),
            h(
                DropdownMenuItem,
                {
                  onClick: () => {
                    const item = row.original;
                    handleEdit(item,"custo"); // Função para abrir o modal de edição
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
                h("div", {class: "flex items-center"}, "Remover")
            ),
          ]),
        ]),
  }),

];
const fetchFilters = async () => {
  try {
    loadingSectors.value = true;
    const response = await api.get(`/user/configurations/project-filters`);
    const filters = response.data.data || [];
    projectFilters.value = filters.map((filter: any) => ({
      id: filter.id,
      label: filter.label,
    }));
    if (filters.length > 0 && !selectedFilterId.value) {
      const favoriteFilter = filters.find((filter: any) => filter.is_favorite);
      selectedFilterId.value = favoriteFilter ? favoriteFilter.id : filters[0].id;
    }
  } catch (error) {
    toast({
      title: "Erro ao carregar filtros",
      description: "Não foi possível carregar os filtros de projetos.",
      variant: "destructive",
    });
  } finally {
    await fetchCosts();
    await fetchSectors();
    loadingSectors.value = false;
  }
};
onMounted(()=> {
  fetchFilters();

});
const sectors = ref([]);
const openSheet = () => {
  form.value.type = 'custo';
  isEditing.value = false;
  costForm.value = { name: '', project_id: selectedFilterId.value, user_id: null };
  showModal.value = true;
};
const fetchSectors = async () => {
  try {
    loadingSectors.value = true;
    const response = await api.get(`/financial/sector`, {
      params: {
        filter_id: selectedFilterId.value,

      }
    });
    sectors.value = response.data.data.data.map((sector: any) => ({
      id: sector.id,
      name: sector.name,
    }));


  } catch (error) {
    console.error('Erro ao buscar setores:', error);
  } finally {
    loadingSectors.value = false;
  }
};
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciamento de Custos</h2>
      <p class="text-muted-foreground">Gerencie os centros de custo financeiros, adicionando ou editando informações
        para
        otimizar o controle e organização do orçamento.</p>
    </div>
    <div   v-if="projectFilters && projectFilters.length" class="flex sm:flex-row flex-col w-full items-start gap-2">
      <Select v-model="selectedFilterId">
        <SelectTrigger class="sm:w-[250px] w-full">
          <SelectValue placeholder="Selecione um grupo ou projeto" />
        </SelectTrigger>
        <SelectContent>
          <template v-for="(item, index) in projectFilters" :key="index">
            <SelectItem :value="item.id">{{ item.label }}</SelectItem>
          </template>
        </SelectContent>
      </Select>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Custos</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomDataTable :data="costs" :columns="columns" :loading="loadingCosts" />
      </CardContent>
      <CustomPagination :select-page="fetchCosts" :pages="pages"/>
      <CardFooter>
        <Button  @click="openSheet()">Criar Custo</Button>
      </CardFooter>
    </Card>



    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? `Editar ${form.type}` : `Novo ${form.type}` }}
          </SheetTitle>
          <SheetDescription>
            {{ isEditing ? `Edite as informações do ${form.type}.` : `Crie um novo ${form.type}.` }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="submitCost">
          <div class="grid gap-4 py-4">

            <div class="grid grid-cols-4 items-center gap-4"><Label for="name">Categoria</Label>
              <div class="col-span-3">
                <Select v-model="costForm.name">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marketing e Vendas">Marketing e Vendas</SelectItem>
                    <SelectItem value="Pessoal">Pessoal</SelectItem>
                    <SelectItem value="Administrativas">Administrativas</SelectItem>
                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <Input v-if="costForm.name === 'Outros'" v-model="costForm.otherName" placeholder="Digite o nome"
                       class="mt-2"/>
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="sector_id">Setor</Label>
              <Select v-model="costForm.sector_id">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="sector in sectors" :key="sector.id" :value="sector.id">
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

