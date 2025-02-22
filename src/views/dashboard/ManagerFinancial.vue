<script setup lang="ts">

import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {createColumnHelper} from "@tanstack/vue-table";
import {h, onMounted, ref, watch} from "vue";
import api from "@/services/api";
import {getLocalTimeZone, today} from "@internationalized/date";
import { useAuthStore } from "@/stores/auth";
import {Loader2 as LucideSpinner} from "lucide-vue-next";
import { useProjectStore } from "@/stores/project";
import {toast} from "@/components/ui/toast";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import {MoreHorizontal} from "lucide-vue-next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const authStore = useAuthStore();
interface FinancialData {
  costCenter: string;
  category: string;
  value: string;
  date: string;
  description: string;
  percentage:string;
  type:string;
}
const loadingRemove = ref(false)

const columnHelper = createColumnHelper<FinancialData >()
const columns = [
  columnHelper.accessor('costCenter', {
    header: 'Centro de Custo',
    cell: ({row}) => h('div', {class: "capitalize"}, row.getValue("costCenter"))
  }),
  columnHelper.accessor('category', {
    header: 'Categoria',
    cell: ({row}) => h('div', {class: "capitalize"}, row.getValue("category"))
  }),
  columnHelper.accessor('value', {
    header: 'Valor',
    cell: ({row}) => h('div', {}, (row.getValue("value")))
  }),
  columnHelper.accessor('date', {
    header: 'Data',
    cell: ({row}) => h('div', {}, row.getValue("date"))
  }),
  columnHelper.accessor('description', {
    header: 'Descrição',
    cell: ({row}) => h('div', {}, row.getValue("description"))
  }),
  columnHelper.accessor('percentage', {
    header: 'Porcentagem',
    cell: ({row}) => h('div', {}, `${row.getValue("percentage") ? row.getValue("percentage") : "0"}%`)
  }),
  columnHelper.accessor('type', {
    header: 'Tipo',
    cell: ({row}) => h('div', {}, row.getValue("type"))
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
                    disabled: loadingRemove.value || loading.value,
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
                    handleEdit(item,"financeiro"); // Função para abrir o modal de edição
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
                h("div", {class: "flex items-center"}, "Remover")
            ),
          ]),
        ]),
  }),
];
interface SectorData{
  id: number;
  name: string;
  project: string;
}
interface CostData{
  id: number;
  name: string;
  sector: string;
}
const costColumnHelper = createColumnHelper<CostData>();
const costColumns = [
  costColumnHelper.accessor('id', {
    header: 'ID',
    cell: ({row}) => h('div', {}, row.getValue('id')),
  }),
  costColumnHelper.accessor('name', {
    header: 'Nome',
    cell: ({row}) => h('div', {class: 'capitalize'}, row.getValue('name')),
  }),
  costColumnHelper.accessor('sector', {
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
                    disabled: loadingRemove.value || loading.value,
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
const sectorColumnHelper = createColumnHelper<SectorData>();
const sectorColumns = [
  sectorColumnHelper.accessor('id', {
    header: 'ID',
    cell: ({row}) => h('div', {}, row.getValue('id')),
  }),
  sectorColumnHelper.accessor('name', {
    header: 'Nome',
    cell: ({row}) => h('div', {class: 'capitalize'}, row.getValue('name')),
  }),
  sectorColumnHelper.accessor('project', {
    header: 'Projeto',
    cell: ({row}) => h('div', {}, row.getValue('project')),
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
                    disabled: loadingRemove.value || loading.value,
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
                    console.log(item)
                    handleEdit(item,"setor"); // Função para abrir o modal de edição
                  },
                },
                "Editar"
            ),
            h(
                DropdownMenuItem,
                {
                  onClick: () => {
                    const itemId = row.original.id;
                    deleteSector(itemId); // Função para remover o item pelo ID
                  },
                },
                h("div", {class: "flex items-center"}, "Remover")
            ),
          ]),
        ]),
  }),

];
const form = ref({ type: '' });
const sectorForm = ref({});
const costForm = ref({});
const financialForm = ref({});

const openSheet = (type) => {
  form.value.type = type;
  isEditing.value = false;
  if (type === 'setor') {
    sectorForm.value = { name: '', project_id: selectedFilterId.value, user_id: null };
  } else if (type === 'custo') {
    costForm.value = { id: null, name: '', sector_id: null };
  } else if (type === 'financeiro') {
    financialForm.value = { id: null, cost_center_id: null, type: '', category_type: '', percentage: null, amount: null, date: '', description: '', user_id: null };
  }
  showModal.value = true;
};

const handleEdit = (item, type) => {
  form.value.type = type;
  isEditing.value = true;
  if (type === 'setor') {
    sectorForm.value = { ...item };
  } else if (type === 'custo') {
    costForm.value = { ...item };
  } else if (type === 'financeiro') {
    financialForm.value = { ...item };
  }
  showModal.value = true;
};

const deleteSector = async (id: number) => {
  try {
    loading.value = true;
    await api.delete(`/financial/sector/${id}`);
    toast({
      title: "Setor deletado com sucesso!",
      description: `O setor com ID ${id} foi removido.`,
      variant: "success",
    });
    await fetchSectors();
  } catch (error) {
    console.error('Erro ao deletar setor:', error);
    toast({
      title: "Erro ao deletar setor",
      description: "Não foi possível remover o setor. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};


const deleteCost = async (id: number) => {
  try {
    loading.value = true;
    await api.delete(`/financial/cost-centers/${id}`);
    toast({
      title: "Centro de custo deletado com sucesso!",
      description: `O centro de custo com ID ${id} foi removido.`,
      variant: "success",
    });
    await fetchCosts();
  } catch (error) {
    console.error('Erro ao deletar centro de custo:', error);
    toast({
      title: "Erro ao deletar centro de custo",
      description: "Não foi possível remover o centro de custo. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const deleteFinancial = async (id: number) => {
  try {
    loading.value = true;
    await api.delete(`/financial/financial-transactions/${id}`);
    toast({
      title: "Transação financeira deletada com sucesso!",
      description: `A transação financeira com ID ${id} foi removida.`,
      variant: "success",
    });
    await fetchFinancials();
  } catch (error) {
    console.error('Erro ao deletar transação financeira:', error);
    toast({
      title: "Erro ao deletar transação financeira",
      description: "Não foi possível remover a transação financeira. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const submitSector = async () => {
  try {
    loadingSub.value = true;
    if (isEditing.value) {
      await api.put(`/financial/sector/${sectorForm.value.id}`, sectorForm.value);
    } else {
      await api.post('/financial/sector', sectorForm.value);
    }
    showModal.value = false;
  } catch (error) {
    console.error('Erro ao salvar setor:', error);
  } finally {
    loadingSub.value = false;
    await fetchSectors()
  }
};

const submitCost = async () => {
  try {
    loadingSub.value = true;
    if (isEditing.value) {
      await api.put(`/financial/cost-centers/${costForm.value.id}`, costForm.value);
    } else {
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

const submitFinancial = async () => {
  try {
    loadingSub.value = true;
    if (isEditing.value) {
      await api.put(`/financial/financial-transactions/${financialForm.value.id}`, financialForm.value);
    } else {
      await api.post('/financial/financial-transactions', financialForm.value);
    }
    showModal.value = false;
  } catch (error) {
    console.error('Erro ao salvar transação financeira:', error);
  } finally {
    loadingSub.value = false;
    await fetchFinancials();
  }
};

const submit = () => {
  if (form.value.type === 'setor') {
    submitSector();
  } else if (form.value.type === 'custo') {
    submitCost();
  } else if (form.value.type === 'financeiro') {
    submitFinancial();
  }
};

const edit = () => {
  submit();
};
const loadingSub = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const sectors = ref([]);
const costs = ref([]);
const financial = ref([])
const loadingSectors = ref(true);
const loadingCosts = ref(true);
const loadingFinancials = ref(true);
const loading = ref(true);
const projectStore = useProjectStore();
const projectFilters = ref([]);
const selectedFilterId = ref(null);
const fetchFilters = async () => {
  try {
    loading.value = true;
    const response = await api.get("/user/configurations/project-filters");
    const filters = response.data.data || [];

    projectFilters.value = filters.map((filter) => ({
      id: filter.id,
      label: filter.label,
    }));

    if (filters.length > 0) {
      if (!selectedFilterId.value) {
        const favoriteFilter = filters.find((filter) => filter.is_favorite);
        selectedFilterId.value = favoriteFilter
            ? favoriteFilter.id
            : filters[0].id;
      }
    }

  } catch (error) {
    toast({
      title: "Erro ao carregar filtros",
      description: "Não foi possível carregar os filtros de projetos.",
      variant: "destructive",
    });
  } finally {
    await  fetchSectors()
    loading.value = false;

  }
};
const fetchSectors = async () => {
  try {
    loadingSectors.value = true;
    const response = await api.get('/financial/sector', {params: {filter_id: selectedFilterId.value}});
    sectors.value = response.data.data.map(sector =>
        (
          {id:sector.id,name:sector.name,project:sector.project.name}
        ))
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
  } finally {
    loadingSectors.value = false;

  }
};
const fetchCosts = async () => {
  try {
    loadingCosts.value = true;
    const response = await api.get('/financial/cost-centers', {params: {filter_id: selectedFilterId.value}});
    costs.value = response.data.data.map(cost =>
    (
        {id:cost.id,name:cost.name,sector:cost.sector.name}
      ))
    console.log(costs.value)
  } catch (error) {
    console.error('Erro ao buscar centros de custo:', error);
  } finally {
    loadingCosts.value = false;
  }
};
const fetchFinancials = async () => {
  try {
    loadingFinancials.value = true;
    const response = await api.get('/financial/financial-transactions');
    financial.value = response.data.data.map(financial =>
    (
        {costCenter:financial.cost_center.name,
          category:financial.category_type,
          value:financial.amount,
          date:financial.date,
          description:financial.description,
          percentage:financial.percentage,
          type:financial.type}
      ))

  } catch (error) {
    console.error('Erro ao buscar transações financeiras:', error);
  } finally {
    loadingFinancials.value = false;
  }
};
onMounted(() => {
  fetchFilters()
});
watch(selectedFilterId,()=>{
  fetchSectors();
  fetchCosts();
  fetchFinancials();
})
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciamento Financeiro</h2>
      <p class="text-muted-foreground">
        Adicione e gerencie custos, receitas e métricas financeiras para melhorar o controle do seu orçamento.
      </p>
    </div>
    <div class="space-y-6">
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
      <Card >

        <CardContent>

          <CustomDataTable :loading="loadingSectors" :data="sectors" :columns="sectorColumns"/>
        </CardContent>
        <CardFooter class="flex justify-start">
          <div class="flex gap-4 my-4 items-center">
                    <Button @click="openSheet('setor')">Criar Setor</Button>
          </div>
        </CardFooter>
      </Card>
      <Card v-if="sectors.length > 0">
      <CardContent>
        <CustomDataTable :loading="loadingCosts" :data="costs" :columns="costColumns"/>
      </CardContent>
      <CardFooter class="flex justify-start">
        <Button v-if="sectors.length > 0" @click="openSheet('custo')">Criar Custo</Button>
      </CardFooter>
    </Card>
      <Card v-if="costs.length > 0">
        <CardContent>
          <CustomDataTable :loading="loadingFinancials" :data="financial" :columns="columns"/>
        </CardContent>
        <CardFooter class="flex justify-start">
          <Button v-if="costs.length > 0" @click="openSheet('financeiro')">Criar Financeiro</Button>
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
          {{ isEditing ? `Edite as informações do ${form.type}.` : `Crie um novo ${form.type}.` }}
        </SheetDescription>
      </SheetHeader>

      <form @submit.prevent="isEditing ? edit() : submit()">
        <div class="grid gap-4 py-4">
          <template v-if="form.type === 'setor'">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Nome</Label>
              <Input id="name" v-model="sectorForm.name" placeholder="Digite o nome" class="col-span-3" required />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
<!--              <Label for="project_id">Projeto</Label>-->
<!--              <div v-if="projectFilters && projectFilters.length" class="flex sm:flex-row flex-col w-full items-start gap-2">-->
<!--                <Select v-model="sectorForm.project_id">-->
<!--                  <SelectTrigger class="sm:w-[250px] w-full">-->
<!--                    <SelectValue placeholder="Selecione um grupo ou projeto" />-->
<!--                  </SelectTrigger>-->
<!--                  <SelectContent>-->
<!--                    <template v-for="(item, index) in projectFilters" :key="index">-->
<!--                      <SelectItem :value="item.id">{{ item.label }}</SelectItem>-->
<!--                    </template>-->
<!--                  </SelectContent>-->
<!--                </Select>-->
<!--              </div>-->
            </div>
          </template>

          <template v-if="form.type === 'custo'">
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
          </template>

          <template v-if="form.type === 'financeiro'">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="cost_center_id">Centro de Custo</Label>
              <Select v-model="financialForm.cost_center_id">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione um centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cost in costs" :key="cost.id" :value="cost.id">
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
              <Input id="percentage" v-model="financialForm.percentage" type="number" placeholder="Opcional" class="col-span-3" min="0" />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="amount">Valor</Label>
              <Input id="amount" v-model="financialForm.amount" type="number" placeholder="Digite o valor" class="col-span-3" required />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="description">Descrição</Label>
              <Input id="description" v-model="financialForm.description" placeholder="Digite uma descrição" class="col-span-3" />
            </div>
          </template>
        </div>

        <SheetFooter>
          <Button type="submit" :disabled="loadingSub">
            <LucideSpinner v-if="loadingSub" class="mr-2 h-4 w-4 animate-spin" />
            {{ loadingSub ? "Salvando..." : isEditing ? "Salvar" : "Criar" }}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>

<style scoped>

</style>