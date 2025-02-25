<script setup lang="ts">
import {onMounted, ref, watch,h} from 'vue';
import {Card, CardHeader, CardTitle, CardContent, CardFooter} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import { useProjectStore } from "@/stores/project";
import { getLocalTimeZone, today } from "@internationalized/date";

import {useToast} from "@/components/ui/toast";
import {LineChart} from "@/components/ui/chart-line";
const { toast } = useToast();
import { DonutChart } from '@/components/ui/chart-donut'

const loading = ref(true);

const financialTransactions = ref([]);



const currentIndex = ref(0);

const financialData = ref([]);
const sectors = ref([]);
const costs = ref([]);
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

    if (filters.length > 0) {
      if (!selectedFilterId.value) {
        const favoriteFilter = filters.find((filter) => filter.is_favorite);
        selectedFilterId.value = favoriteFilter
            ? favoriteFilter.id
            : filters[0].id;
      }
    }
    await fetchFinancials()
  } catch (error) {
    toast({
      title: "Erro ao carregar filtros",
      description: "Não foi possível carregar os filtros de projetos.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};
onMounted(fetchFilters);
const handleSector = async ()=>{
  if(!selectedSector.value) return;
  currentIndex.value =  selectedSector.value-1
}
const compare = ref(false);
const selectedComparisonProject = ref(null);
const fetchFinancials = async () => {
  try {
    loading.value = true;
    const response = await api.get("/financial/", {
      params: {
        start_date: selectedRange.value.start,
        end_date: selectedRange.value.end,
        filter_id: selectedFilterId.value,
        compare: selectedComparisonProject.value,
      },
    });
    financialData.value = response.data.data;
}catch (error){
    console.log(error)
  }
  finally {
    loading.value = false;
    if (selectedComparisonProject.value) {
     compare.value = true
    }else{
      compare.value = false
    }
  }
}


function valueFormatter(tick: number | Date) {

  return typeof tick === 'number'
      ? `R$ ${new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(tick)}`
      : ''

}
function cancelCompare(){
  compare.value = false;
  selectedComparisonProject.value = null
  fetchFinancials()
}
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Financeiro</h2>
      <p class="text-muted-foreground">
        Visão geral das receitas, despesas e métricas financeiras em um período específico.
      </p>
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
      <DateRangePicker v-model="selectedRange" />
      <Button class="sm:w-fit w-full" @click="fetchFinancials">Filtrar</Button>
    </div>
    <div>
      <div  class="flex gap-4 my-4 items-center">

        <Select v-model="selectedComparisonProject" id="selectedComparisonProject" class="w-full sm:w-[250px]">
          <SelectTrigger>
            <SelectValue placeholder="Selecione um projeto para comparar"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(project, index) in projectFilters"   :key="index" :value="project.id">
              {{ project.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button @click="fetchFinancials">
          Comparar
        </Button>
        <Button @click="cancelCompare" class="ml-2">
          Cancelar Comparação
        </Button>
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
    <div v-else-if="!loading && !compare" class="flex flex-col gap-4 w-full">
      <h3 class="text-xl font-bold tracking-tight">
        {{projectFilters.find(value => value.id == selectedFilterId).label }}
      </h3>
      <div class="grid gap-4 min-[720px]:grid-cols-2 md:gap-8   xl:grid-cols-4 mb-3">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Receita Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold truncate">
              {{ $toCurrency(financialData.receita_bruta) }}
            </div>
          </CardContent>

        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Custos Operacionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold truncate">
              {{ $toCurrency(financialData.custos_operacionais) }}
            </div>
          </CardContent>

        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Lucro Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold truncate">
              {{ $toCurrency(financialData.lucro_bruto) }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold truncate">
              {{ $toCurrency(financialData.lucro_liquido) }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Despesas Operacionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold truncate">
              {{ $toCurrency(financialData.despesas_operacionais) }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Lucro Operacionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold truncate">
              {{ $toCurrency(financialData.lucro_operacional) }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Despesas Outros</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold truncate">
              {{ $toCurrency(financialData.despesas_outros) }}
            </div>
          </CardContent>
        </Card>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <Card v-if="financialData.cost_centers.length>0" class="h-fit space-y-2">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Gastos por Centro de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart :data="financialData.cost_centers"
                        index="Centro"
                        :value-formatter="valueFormatter"
                        :category="'Valor'"

            />
          </CardContent>
        </Card>
        <Card v-if="financialData.revenue_cost.length>0">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Receita x Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart :data="financialData.revenue_cost" :categories="['Receita','Custo']" index="date"
            />
          </CardContent>
        </Card>
      </div>
    </div>    <!-- Comparação -->
    <div v-else>
      <div class="grid grid-cols-2 gap-4 ">
        <div class="col-span-1 space-y-4">
          <h3 class="text-xl font-bold tracking-tight truncate">
            {{projectFilters.find(value => value.id == selectedFilterId).label }}
          </h3>
          <div class="flex gap-4 flex-wrap">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Receita Bruta</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl w-full font-bold text-ellipsis overflow-hidden whitespace-nowrap truncate">
                  {{ $toCurrency(financialData[0].receita_bruta) }}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Receita Líquida</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold truncate">
                  {{ $toCurrency(financialData[0].receita_liquida) }}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Lucro Bruto</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold truncate">
                  {{ $toCurrency(financialData[0].lucro_bruto) }}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold truncate">
                  {{ $toCurrency(financialData[0].lucro_liquido) }}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div class=" col-span-1 space-y-4">
          <h3 class="text-xl font-bold tracking-tight truncate">
            {{projectFilters.find(value => value.id == selectedComparisonProject).label }}
          </h3>
          <div class="flex gap-4 flex-wrap">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Receita Bruta</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold truncate">
                  {{ $toCurrency(financialData[1].receita_bruta) }}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Receita Líquida</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold truncate">
                  {{ $toCurrency(financialData[1].receita_liquida) }}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Lucro Bruto</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold truncate">
                  {{ $toCurrency(financialData[1].lucro_bruto) }}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium truncate">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold truncate">
                  {{ $toCurrency(financialData[1].lucro_liquido) }}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<style scoped>
</style>
