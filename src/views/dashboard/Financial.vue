<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CreditCard, HandCoins } from 'lucide-vue-next';
import api from "@/services/api";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import { useProjectStore } from "@/stores/project";
import { getLocalTimeZone, today } from "@internationalized/date";
import { SquarePen } from 'lucide-vue-next';
import {Loader2 as LucideSpinner} from "lucide-vue-next";

const loading = ref(true);
const loadingSubSector = ref(false);
const loadingSubCost = ref(false);
const loadingSubFin = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const sectors = ref([]);
const costs = ref([]);
const financialTransactions = ref([]);
const form = ref({ type: '' });
const sectorForm = ref({
  name: '',
  project_id: null,
  user_id: null
});
const costForm = ref({
  id: null, // adicionei id para identificar o registro durante a edição
  name: '',
  sector_id: null,
});
const financialForm = ref({
  id: null, // adicionei id para identificar o registro durante a edição
  cost_center_id: null,
  type: '',
  category_type: '',
  percentage: null,
  amount: null,
  date: '',
  description: '',
  user_id: null
});

// Função para abrir o sheet para criação
const openSheet = (type) => {
  form.value.type = type;
  isEditing.value = false;
  // Limpar os formulários se necessário
  if (type === 'setor') {
    sectorForm.value = { name: '', project_id: null, user_id: null };
  } else if (type === 'custo') {
    costForm.value = { id: null, name: '', sector_id: null };
  } else if (type === 'financeiro') {
    financialForm.value = { id: null, cost_center_id: null, type: '', category_type: '', percentage: null, amount: null, date: '', description: '', user_id: null };
  }
  showModal.value = true;
};

// Função para abrir o sheet em modo de edição
const handleEdit = (item, type) => {
  form.value.type = type;
  isEditing.value = true;
  if (type === 'setor') {
    // Supondo que o item possua os mesmos campos do sectorForm
    sectorForm.value = { ...item };
  } else if (type === 'custo') {
    costForm.value = { ...item };
  } else if (type === 'financeiro') {
    financialForm.value = { ...item };
  }
  showModal.value = true;
};

const submitSector = async () => {
  try {
    loadingSubSector.value = true;
    if (isEditing.value) {
      // Aqui você pode implementar a atualização (PUT/PATCH)
      await api.put(`/financial/sector/${sectorForm.value.id}`, sectorForm.value);
    } else {
      await api.post('/financial/sector', sectorForm.value);
    }
    showModal.value = false;
    fetchFinancesByProject();
  } catch (error) {
    console.error('Erro ao salvar setor:', error);
  } finally {
    loadingSubSector.value = false;
  }
};

const submitCost = async () => {
  try {
    loadingSubCost.value = true;
    if (isEditing.value) {
      await api.put(`/financial/cost-centers/${costForm.value.id}`, costForm.value);
    } else {
      await api.post('/financial/cost-centers', costForm.value);
    }
    showModal.value = false;
    fetchFinancesByProject();
  } catch (error) {
    console.error('Erro ao salvar centro de custo:', error);
  } finally {
    loadingSubCost.value = false;
  }
};

const submitFinancial = async () => {
  try {
    loadingSubFin.value = true;
    if (isEditing.value) {
      await api.put(`/financial/financial-transactions/${financialForm.value.id}`, financialForm.value);
    } else {
      await api.post('/financial/financial-transactions', financialForm.value);
    }
    showModal.value = false;
    fetchFinancesByProject();
  } catch (error) {
    console.error('Erro ao salvar transação financeira:', error);
  } finally {
    loadingSubFin.value = false;
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
  console.log('Salvando edição...');
  submit();
};

const financesByProject = ref([]);

// Exemplo de função para atualizar os dados (implemente conforme sua API)
const fetchFinancesByProject = async () => {
  try {
    loading.value = true;
    // Implemente a chamada à API para atualizar os dados
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
  } finally {
    loading.value = false;
  }
};

const fetchSectors = async () => {
  try {
    loading.value = true;
    const response = await api.get('/financial/sector', {});
    const data = response.data.data;
    financialData.value = data[1];
    console.log(financialData.value);
    sectors.value = data; // Lista de setores paginada
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
  } finally {
    loading.value = false;
  }
};
onMounted(fetchSectors);
const financialData = ref([]);

const projectStore = useProjectStore();
const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const projectFilters = ref([]);
const selectedFilterId = ref(projectStore.selectedProject);
const selectedSector = ref(null);
const fetchFilters = async () => {
  try {
    loading.value = true;
    const response = await api.get("/user/configurations/project-filters");
    const filters = response.data.data || [];
    projectFilters.value = filters.map((filter) => ({
      id: filter.id,
      label: filter.label,
    }));
  } catch (error) {
    console.log(error);
  } finally {
    //loading.value = false;
  }
};
onMounted(fetchFilters);

const financeIndicators = [
  "Receita Bruta",
  "(-) Impostos sobre vendas",
  "(=) Receita Líquida",
  "(-) Custos Operacionais",
  "(=) Lucro Bruto",
  "(-) Despesas Operacionais",
  "(=) Lucro Operacional (EBIT)",
  "(-) Despesas Financeiras",
  "(=) Lucro Líquido"
];
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Financeiro</h2>
      <p class="text-muted-foreground">
        TEXTO
      </p>
    </div>

    <div class="flex sm:flex-row flex-col w-full items-start gap-2">
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
      <DateRangePicker v-model="selectedRange" />
      <Button class="sm:w-fit w-full" @click="{}">Filtrar</Button>
    </div>
    <div>
      <div class="flex gap-4 items-center sm:w-[250px]">
        <Select v-model="selectedSector" id="selectedSector" class="w-full max-w-sm">
          <SelectTrigger>
            <SelectValue placeholder="Selecione um setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(sector, index) in sectors" :key="index" :value="sector.sector_id">
              {{ sector.sector_name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex gap-4 my-4 items-center">
        <Button @click="openSheet('setor')">Criar Setor</Button>
        <Button @click="openSheet('custo')">Criar Custo</Button>
        <Button @click="openSheet('financeiro')">Criar Financeiro</Button>
      </div>
    </div>

    <div v-if="loading" class="grid gap-4 min-[720px]:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 mb-3">
      <Card v-for="n in 9" :key="n">
        <div class="p-4 rounded shadow">
          <div class="flex justify-between items-center mb-2">
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-4 w-5" />
          </div>
          <Skeleton class="h-8 w-2/3 mb-2" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </Card>
    </div>

    <div class="flex gap-6 flex-wrap" v-else>
      <!-- Exemplo para centro de custo -->
      <Card v-for="n in financialData.cost_centers" :key="n.id">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{{ n.cost_center_name }}</CardTitle>
          <!-- Ao clicar no SquarePen, abre o sheet em modo de edição -->
          <SquarePen
              :size="18"
              :stroke-width="1.85"
              class="cursor-pointer"
              @click="handleEdit(n, 'custo')"
          />
        </CardHeader>
        <CardContent class="grid gap-4 min-[720px]:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 mb-3">
          <Card v-for="(item, index) in n.dre" :key="index">
            <CardHeader>
              <CardTitle class="text-sm font-medium">{{ item[0] }}</CardTitle>
            </CardHeader>
            <CardContent class="flex gap-2 flex-wrap">
              <p class="text-2xl font-bold">
                {{$toCurrency(item[1])}}
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
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
            <!-- Se for Setor -->
            <template v-if="form.type === 'setor'">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name">Nome</Label>
                <Input id="name" v-model="sectorForm.name" placeholder="Digite o nome" class="col-span-3" required />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="project_id">Projeto</Label>
                <div v-if="projectFilters && projectFilters.length" class="flex sm:flex-row flex-col w-full items-start gap-2">
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
              </div>
            </template>

            <!-- Se for Custo -->
            <template v-if="form.type === 'custo'">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name">Nome</Label>
                <Input id="name" v-model="costForm.name" placeholder="Digite o nome" class="col-span-3" required />
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

            <!-- Se for Financeiro -->
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
            <Button type="submit" :disabled="loading">
              <LucideSpinner v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? "Salvando..." : isEditing ? "Salvar" : "Criar" }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style scoped>
/* Seus estilos aqui */
</style>
