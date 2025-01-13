<template>
  <div class="space-y-6 p-10 max-w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Active Campaign</h2>
      <p class="text-muted-foreground">
        Métricas baseadas nas campanhas do Active Campaign.
      </p>
    </div>
    <div
      class="flex items-center justify-end mb-3"
      v-if="projectFilters && projectFilters.length"
    >
      <div class="flex items-center gap-2 w-full">
        <Select v-model="selectedFilterId">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Selecione um grupo ou projeto" />
          </SelectTrigger>
          <SelectContent>
            <template v-for="(item, index) in projectFilters" :key="index">
              <SelectItem :value="item.id">{{ item.label }}</SelectItem>
            </template>
          </SelectContent>
        </Select>
        <div class="flex gap-2 w-full">
          <DateRangePicker v-model="selectedRange" class="flex-1" />
          <Button class="flex-1" @click="applyFilter">Filtrar</Button>
        </div>
      </div>
    </div>

    <div>
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table class="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Campanha</TableHead>
                <TableHead>Última Data de Envio</TableHead>
                <TableHead>Número de Envios</TableHead>
                <TableHead>Número de Aberturas</TableHead>
                <TableHead>Número de Cliques</TableHead>
                <TableHead>Número de Cancelamentos</TableHead>
                <TableHead>Número de Bounces</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="loading">
                <TableRow v-for="n in 5" :key="`loading-${n}`">
                  <TableCell colspan="7">
                    <Skeleton class="h-4 w-full bg-gray-300" />
                  </TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow v-for="(campaign, index) in campaigns" :key="index">
                  <TableCell>{{ campaign.name }}</TableCell>
                  <TableCell>{{
                    $moment(campaign.ldate).format("DD/MM/YYYY HH:mm:ss")
                  }}</TableCell>
                  <TableCell>{{ campaign.send_amt }}</TableCell>
                  <TableCell>{{ campaign.uniqueopens }}</TableCell>
                  <TableCell>{{ campaign.subscriberclicks }}</TableCell>
                  <TableCell>{{ campaign.unsubscribes }}</TableCell>
                  <TableCell>{{ campaign.softbounces }}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Total</b></TableCell>
                  <TableCell></TableCell>
                  <TableCell>{{ campaignsStats.send_amt }}</TableCell>
                  <TableCell>{{ campaignsStats.uniqueopens }}</TableCell>
                  <TableCell>{{ campaignsStats.subscriberclicks }}</TableCell>
                  <TableCell>{{ campaignsStats.unsubscribes }}</TableCell>
                  <TableCell>{{ campaignsStats.softbounces }}</TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
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
import moment from "moment";
import "moment/dist/locale/pt-br";
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
const campaigns = ref([]);
const campaignsStats = computed(() => {
  const totalStats = {
    send_amt: 0,
    uniqueopens: 0,
    subscriberclicks: 0,
    unsubscribes: 0,
    softbounces: 0,
  };
  campaigns.value.forEach((campaign) => {
    totalStats.send_amt += campaign.send_amt;
    totalStats.uniqueopens += campaign.uniqueopens;
    totalStats.subscriberclicks += campaign.subscriberclicks;
    totalStats.unsubscribes += campaign.unsubscribes;
    totalStats.softbounces += campaign.softbounces;
  });
  return totalStats;
});

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
    const response = await api.get("/utils/active-campaign", {
      params: {
        start_date: selectedRange.value.start?.toString(),
        end_date: selectedRange.value.end?.toString(),
        filter_id: selectedFilterId.value,
      },
    });

    campaigns.value = response.data.data.campaigns;
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
