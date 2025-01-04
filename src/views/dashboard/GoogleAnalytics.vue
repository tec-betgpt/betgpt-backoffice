<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Google Analytics</h2>
      <p class="text-muted-foreground">
        Métricas baseadas na integração com o Google Analytics.
      </p>
    </div>
    <div
      class="flex items-center justify-end mb-3"
      v-if="projectFilters && projectFilters.length"
    >
      <div class="flex items-center max-[450px]:flex-col gap-2 w-full">
        <Select v-model="selectedFilterId">
          <SelectTrigger class="md:w-[250px]">
            <SelectValue placeholder="Selecione um grupo ou projeto" />
          </SelectTrigger>
          <SelectContent>
            <template v-for="(item, index) in projectFilters" :key="index">
              <SelectItem :value="item.id">{{ item.label }}</SelectItem>
            </template>
          </SelectContent>
        </Select>
        <div class="flex gap-2 w-full">
          <DateRangePicker v-model="selectedRange" class="max-[450px]:flex-2" />
          <Button class="max-[450px]:flex-1" @click="applyFilter"
            >Filtrar</Button
          >
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="usersPeriod"
              index="date"
              :categories="['Usuários Ativos', 'Usuários Registrados']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number'
                    ? `${new Intl.NumberFormat('pt-BR')
                        .format(tick)
                        .toString()}`
                    : ''
              "
              :custom-tooltip="CustomChartTooltip"
            />
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="totalUsersPeriod"
                index="date"
                :categories="['Total de Usuários']"
                :custom-tooltip="CustomChartTooltip"
              />
            </div>
          </CardContent>
        </Card>
        <Card class="col-span-3">
          <CardHeader class="pb-3">
            <Skeleton class="h-6 w-full" v-if="loading" />
            <CardTitle v-else>Usuários Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading">
              <Skeleton class="pl-5 h-80 w-full" />
            </div>
            <div v-else>
              <LineChart
                :data="returningUsersPeriod"
                index="date"
                :categories="['Usuários Recorrentes']"
                :custom-tooltip="CustomChartTooltip"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Total de Primeiros Compradores</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="firstTimePurchasersPeriod"
              index="date"
              :categories="['Primeiros Compradores']"
              :custom-tooltip="CustomChartTooltip"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Usuários Ativos Pagantes por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="payingActivePeriod"
              index="date"
              :categories="[
                '7D Pagantes Ativos',
                '14D Pagantes Ativos',
                '28D Pagantes Ativos',
              ]"
              :custom-tooltip="CustomChartTooltip"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <Skeleton class="h-6 w-full" v-if="loading" />
          <CardTitle v-else>Taxa de Engajamento por período</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading">
            <Skeleton class="pl-5 h-80 w-full" />
          </div>
          <div v-else>
            <LineChart
              :data="engagementRatePeriod"
              index="date"
              :categories="['% Taxa de Engajamento']"
              :y-formatter="
                (tick, i) =>
                  typeof tick === 'number' ? `${(tick / 100).toFixed(2)}%` : ''
              "
              :custom-tooltip="CustomChartTooltipPercent"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useProjectStore } from "@/stores/project";
import api from "@/services/api";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/chart-line";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast/use-toast";
import CustomChartTooltipPrice from "@/components/custom/CustomChartTooltipPrice.vue";
import CustomChartTooltipPercent from "@/components/custom/CustomChartTooltipPercent.vue";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";

const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

const projectStore = useProjectStore();
const projectFilters = ref([]);
const selectedFilterId = ref(projectStore.selectedProject);
const loadingFilters = ref(true);

const loading = ref(true);
const projects = ref(null);
const usersPeriod = ref([]);
const totalUsersPeriod = ref([]);
const returningUsersPeriod = ref([]);
const firstTimePurchasersPeriod = ref([]);
const payingActivePeriod = ref([]);
const engagementRatePeriod = ref([]);

const fetchFilters = async () => {
  try {
    loadingFilters.value = true;
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
    loadingFilters.value = false;
  }
};

const applyFilter = async () => {
  loading.value = true;
  if (!selectedFilterId.value) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });
    return;
  }

  projectStore.setSelectedProject(selectedFilterId.value);

  try {
    const response = await api.get("/utils/google-analytics", {
      params: {
        start_date: selectedRange.value.start?.toString(),
        end_date: selectedRange.value.end?.toString(),
        filter_id: selectedFilterId.value,
      },
    });

    usersPeriod.value = response.data.data.users_period;
    totalUsersPeriod.value = response.data.data.total_users_period;
    returningUsersPeriod.value = response.data.data.returning_users_period;
    firstTimePurchasersPeriod.value =
      response.data.data.first_time_purchasers_period;
    payingActivePeriod.value = response.data.data.paying_active_period;
    engagementRatePeriod.value = response.data.data.engagement_rate_period;
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFilters().then(() => {
    if (selectedFilterId.value) {
      applyFilter();
    }
  });
});
</script>
