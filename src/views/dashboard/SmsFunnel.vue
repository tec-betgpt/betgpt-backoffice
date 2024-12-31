<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">SMS Funnel Analytics</h2>
      <p class="text-muted-foreground">
        Visão geral e métricas detalhadas de SMS e WhatsApp.
      </p>
    </div>
    <div
      class="flex items-center justify-end mb-3"
      v-if="projectFilters && projectFilters.length"
    >
      <div class="flex items-center space-x-2">
        <Select v-model="selectedFilterId">
          <SelectTrigger class="w-[250px]">
            <SelectValue placeholder="Selecione um grupo ou projeto" />
          </SelectTrigger>
          <SelectContent>
            <template v-for="(item, index) in projectFilters" :key="index">
              <SelectItem :value="item.id">{{ item.label }}</SelectItem>
            </template>
          </SelectContent>
        </Select>
        <DateRangePicker v-model="selectedRange" />
        <Button @click="applyFilter">Filtrar</Button>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <div v-if="loading" :class="responsiveClass">
          <div v-for="n in 3" :key="n" class="p-4 bg-white rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </div>
        <div :class="responsiveClass" v-else>
          <Card class="">
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium">SMS Contratado</CardTitle>
              <Mail class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">+{{ last.sms.contracted }}</div>
            </CardContent>
          </Card>

          <Card class="">
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium">SMS Enviado</CardTitle>
              <MailCheck class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">+{{ last.sms.sent }}</div>
            </CardContent>
          </Card>

          <Card class="">
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium">SMS Disponível</CardTitle>
              <MailPlus class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">+{{ last.sms.available }}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div v-if="loading" :class="responsiveClass">
          <div v-for="n in 3" :key="n" class="p-4 bg-white rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </div>
        </div>
        <div :class="responsiveClass" v-else>
          <Card class="">
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium"
                >WhatsApp Contratado</CardTitle
              >
              <Mail class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                +{{ last.whatsapp.contracted }}
              </div>
            </CardContent>
          </Card>

          <Card class="">
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium"
                >WhatsApp Enviado</CardTitle
              >
              <MailCheck class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">+{{ last.whatsapp.sent }}</div>
            </CardContent>
          </Card>

          <Card class="">
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium"
                >WhatsApp Disponível</CardTitle
              >
              <MailPlus class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                +{{ last.whatsapp.available }}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div class="grid gap-4 md:grid-cols-6 lg:grid-cols-6 mb-3">
          <Card class="col-span-3">
            <CardHeader class="pb-3">
              <Skeleton class="h-6 w-full" v-if="loading" />
              <CardTitle v-else>SMS Enviado</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="loading">
                <Skeleton class="pl-5 h-80 w-full" />
              </div>
              <div v-else>
                <LineChart
                  :data="daily.sms"
                  index="date"
                  :categories="['Total SMS Enviado']"
                  :custom-tooltip="CustomChartTooltip"
                />
              </div>
            </CardContent>
          </Card>
          <Card class="col-span-3">
            <CardHeader class="pb-3">
              <Skeleton class="h-6 w-full" v-if="loading" />
              <CardTitle v-else>Whatsapp Enviado</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="loading">
                <Skeleton class="pl-5 h-80 w-full" />
              </div>
              <div v-else>
                <LineChart
                  :data="daily.whatsapp"
                  index="date"
                  :categories="['Total SMS Enviado']"
                  :custom-tooltip="CustomChartTooltip"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Últimas Recargas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table class="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="loading">
                  <TableRow v-for="n in 5" :key="`loading-${n}`">
                    <TableCell
                      ><Skeleton class="h-4 w-full bg-gray-300"
                    /></TableCell>
                    <TableCell
                      ><Skeleton class="h-4 w-full bg-gray-300"
                    /></TableCell>
                    <TableCell
                      ><Skeleton class="h-4 w-full bg-gray-300"
                    /></TableCell>
                    <TableCell
                      ><Skeleton class="h-4 w-full bg-gray-300"
                    /></TableCell>
                    <TableCell
                      ><Skeleton class="h-4 w-full bg-gray-300"
                    /></TableCell>
                    <TableCell
                      ><Skeleton class="h-4 w-full bg-gray-300"
                    /></TableCell>
                    <TableCell
                      ><Skeleton class="h-4 w-full bg-gray-300"
                    /></TableCell>
                  </TableRow>
                </template>
                <template v-else>
                  <TableRow v-for="(recharge, index) in recharges" :key="index">
                    <TableCell>{{
                      $moment(recharge.date).format("DD/MM/YYYY HH:mm:ss")
                    }}</TableCell>
                    <TableCell>{{ recharge.description }}</TableCell>
                    <TableCell>{{ recharge.service }}</TableCell>
                    <TableCell>{{ recharge.credits }}</TableCell>
                    <TableCell>{{ $toCurrency(recharge.price) }}</TableCell>
                    <TableCell>{{ $toCurrency(recharge.total) }}</TableCell>
                    <TableCell>
                      <span
                        class="text-green-600"
                        v-if="recharge.situation == 'APPROVED'"
                        >Confirmado</span
                      >
                      <span class="text-red-600" v-else>Pendente</span>
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast/use-toast";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import { Mail, MailCheck, MailPlus } from "lucide-vue-next";

const responsiveClass =
  "grid gap-4 min-[720px]:grid-cols-2 md:gap-8  lg:grid-cols-3 xl:grid-cols-4 mb-3";

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
const last = ref([]);
const daily = ref([]);
const recharges = ref([]);

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
    const response = await api.get("/utils/sms-funnel", {
      params: {
        start_date: selectedRange.value.start?.toString(),
        end_date: selectedRange.value.end?.toString(),
        filter_id: selectedFilterId.value,
      },
    });

    last.value = response.data.data.last;
    daily.value = response.data.data.daily;
    recharges.value = response.data.data.recharges;
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
