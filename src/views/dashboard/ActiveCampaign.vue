<template>
  <div class="space-y-6 p-10 max-w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Active Campaign</h2>
      <p class="text-muted-foreground">
        Métricas baseadas nas campanhas do Active Campaign.
      </p>
    </div>
    <div
        class="flex flex-col items-start justify-end mb-3 gap-2"
        v-if="projectFilters && projectFilters.length"
    >
      <div class="flex sm:flex-row flex-col  gap-2">
        <Select v-model="selectedFilterId">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Selecione um grupo ou projeto"/>
          </SelectTrigger>
          <SelectContent>
            <template v-for="(item, index) in projectFilters" :key="index">
              <SelectItem :value="item.id">{{ item.label }}</SelectItem>
            </template>
          </SelectContent>
        </Select>
        <DateRangePicker v-model="selectedRange" class="flex-1"/>
        <Button class="flex-1" @click="applyFilter">Filtrar</Button>
      </div>

    </div>

    <div>
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <Input class="max-w-sm" placeholder="Filtrar campanha..."

                 v-model="nameCampaigns"
                 @update:model-value="applyFilter"
          />

          <Table class="min-w-full transition-all delay-500 ease-linear my-2">
            <TableHeader>
              <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <TableHead
                    v-for="header in headerGroup.headers" :key="header.id" :data-pinned="header.column.getIsPinned()"
                >
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()"/>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="loading">
                <TableRow v-for="n in 5" :key="`loading-${n}`">
                  <TableCell v-for="m in 12" :key="`loading-cell-${n}-${m}`">
                    <Skeleton class="h-4 w-full bg-gray-300"/>
                  </TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow v-for="(campaign, index) in campaigns" :key="index">
                  <TableCell>{{ campaign.name }}</TableCell>
                  <TableCell> {{$moment(campaign.ldate).format("DD/MM/YYYY") }}</TableCell>
                  <TableCell>{{ campaign.send_amt }}</TableCell>
                  <TableCell>{{ campaign.uniqueopens }}</TableCell>
                  <TableCell>{{ campaign.subscriberclicks }}</TableCell>
                  <TableCell>{{ campaign.unsubscribes }}</TableCell>
                  <TableCell>{{ campaign.softbounces }}</TableCell>
                  <TableCell>
                    {{
                      campaign.send_amt - campaign.softbounces === 0
                          ? "0%"
                          : (
                          (campaign.uniqueopens /
                              (campaign.send_amt - campaign.softbounces)) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaign.uniqueopens === 0
                          ? "0%"
                          : (
                          (campaign.subscriberclicks / campaign.uniqueopens) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaign.send_amt - campaign.softbounces === 0
                          ? "0%"
                          : (
                          (campaign.subscriberclicks /
                              (campaign.send_amt - campaign.softbounces)) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaign.send_amt - campaign.softbounces === 0
                          ? "0%"
                          : (
                          (campaign.unsubscribes /
                              (campaign.send_amt - campaign.softbounces)) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaign.send_amt === 0
                          ? "0%"
                          : (
                          (campaign.softbounces / campaign.send_amt) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Total</b></TableCell>
                  <TableCell></TableCell>
                  <TableCell>{{ campaignsStats.send_amt }}</TableCell>
                  <TableCell>{{ campaignsStats.uniqueopens }}</TableCell>
                  <TableCell>{{ campaignsStats.subscriberclicks }}</TableCell>
                  <TableCell>{{ campaignsStats.unsubscribes }}</TableCell>
                  <TableCell>{{ campaignsStats.softbounces }}</TableCell>
                  <TableCell>
                    {{
                      campaignsStats.send_amt - campaignsStats.softbounces === 0
                          ? "0%"
                          : (
                          (campaignsStats.uniqueopens /
                              (campaignsStats.send_amt -
                                  campaignsStats.softbounces)) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaignsStats.uniqueopens === 0
                          ? "0%"
                          : (
                          (campaignsStats.subscriberclicks /
                              campaignsStats.uniqueopens) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaignsStats.send_amt - campaignsStats.softbounces === 0
                          ? "0%"
                          : (
                          (campaignsStats.subscriberclicks /
                              (campaignsStats.send_amt -
                                  campaignsStats.softbounces)) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaignsStats.send_amt - campaignsStats.softbounces === 0
                          ? "0%"
                          : (
                          (campaignsStats.unsubscribes /
                              (campaignsStats.send_amt -
                                  campaignsStats.softbounces)) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                  <TableCell>
                    {{
                      campaignsStats.send_amt === 0
                          ? "0%"
                          : (
                          (campaignsStats.softbounces /
                              campaignsStats.send_amt) *
                          100
                      ).toFixed(2) + "%"
                    }}
                  </TableCell>
                </TableRow>

              </template>
            </TableBody>


          </Table>
          <CardFooter class="py-4 w-full">
            <Pagination class="w-full" v-if="pages.last>1" v-slot="{ page }" :total="pages.total" :items-per-page="10"
                        :sibling-count="1" show-edges :default-page="1">
              <PaginationList v-slot="{ items }" class="flex items-center gap-2">
                <PaginationFirst as-child @click="applyFilter()"/>
                <PaginationPrev as-child @click="applyFilter(pages.current--)"/>
                <template v-for="(item, index) in items">
                  <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
                    <Button class="w-9 h-9 p-0" :variant="item.value === pages.current ? 'default' : 'outline'"
                            @click="applyFilter(index+1)">
                      {{ item.value }}
                    </Button>
                  </PaginationListItem>
                  <PaginationEllipsis v-else :key="item.type" :index="index"/>
                </template>

                <PaginationNext as-child @click="applyFilter(pages.current++)"/>
                <PaginationLast as-child @click="applyFilter(pages.last)"/>
              </PaginationList>
            </Pagination>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed, h} from "vue";
import {useProjectStore} from "@/stores/project";
import api from "@/services/api";
import {CalendarDate, getLocalTimeZone, today} from "@internationalized/date";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Button} from "@/components/ui/button";
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
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
  TableCell, TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import moment from "moment";
import "moment/dist/locale/pt-br";
import {useToast} from "@/components/ui/toast/use-toast";
import {CaretSortIcon, ChevronDownIcon} from '@radix-icons/vue'
import {Input} from '@/components/ui/input'

import {
  ColumnFiltersState,
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import DateRangePicker from "@/components/custom/DateRangePicker.vue";

import {cn} from "@/lib/utils";

const currentDate = today(getLocalTimeZone()).subtract({days: 0});
const startDate = currentDate.subtract({days: 28});
const selectedRange = ref({start: startDate, end: currentDate});
const {toast} = useToast();

const projectStore = useProjectStore();
const projectFilters = ref([]);
const selectedFilterId = ref(projectStore.selectedProject);
const loadingFilters = ref(true);
const orderId = ref()
const loading = ref(true);
const projects = ref(null);
const campaigns = ref<CampaignMetrics[]>();
const pages = ref({
  current: 1,
  total: 0,
  last: 0
})
const nameCampaigns = ref()
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

const applyFilter = async (current) => {
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
    const response = await api.get(`/utils/active-campaign?page=${current ?? pages?.value?.current}`, {
      params: {
        start_date: selectedRange.value.start?.toString(),
        end_date: selectedRange.value.end?.toString(),
        filter_id: selectedFilterId.value,
        order_by: orderId.value
      },
    });

    campaigns.value = response.data.data.campaigns.campaigns;
    pages.value = {
      current: response.data.data.campaigns.pagination.current_page,
      total: response.data.data.campaigns.pagination.total,
      last: response.data.data.campaigns.pagination.last_page
    };
  } catch (error) {
    console.log(error)
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const columnHelper = createColumnHelper<CampaignMetrics>()
const columns = [
  columnHelper.accessor('name', {
    header({column}) {
      return "Nome da Campanha";
    },
    cell: ({row}) => h('div', {class: 'capitalize'}, row.getValue('name')),
  }),
  columnHelper.accessor('ldate', {
    header({column}) {
      return h(Button, {
        variant: 'ghost',
        onClick: () => {
          orderId.value = 'ldate';
          applyFilter();
        },
        class: 'h-fit text-pretty my-1',
      }, () => ['Última Data de Envio', h(CaretSortIcon, {class: ''})]);
    },
    cell: ({row}) => h('div', {class: 'lowercase'}, row.getValue('formatted_date')),
  }),
  columnHelper.accessor('send_amt', {
    header({column}) {
      return h(Button, {
        variant: 'ghost',
        onClick: () => {
          orderId.value = 'send_amt';
          applyFilter();
        },
        class: 'h-fit text-pretty my-1',
      }, () => ['Número de Envios', h(CaretSortIcon, {class: ''})]);
    },
    cell: ({row}) => row.getValue('send_amt'),
  }),
  columnHelper.accessor('uniqueopens', {
    header({column}) {
      return h(Button, {
        variant: 'ghost',
        onClick: () => {
          orderId.value = 'uniqueopens';
          applyFilter();
        },
        class: 'h-fit text-pretty my-1',
      }, () => ['Número de Aberturas', h(CaretSortIcon, {class: ''})]);
    },
    cell: ({row}) => row.getValue('uniqueopens'),
  }),
  columnHelper.accessor('subscriberclicks', {
    header({column}) {
      return h(Button, {
        variant: 'ghost',
        onClick: () => {
          orderId.value = 'subscriberclicks';
          applyFilter();
        },
        class: 'h-fit text-pretty my-1',
      }, () => ['Número de Cliques', h(CaretSortIcon, {class: ''})]);
    },
    cell: ({row}) => row.getValue('subscriberclicks'),
  }),
  columnHelper.accessor('unsubscribes', {
    header({column}) {
      return h(Button, {
        variant: 'ghost',
        onClick: () => {
          orderId.value = 'unsubscribes';
          applyFilter();
        },
        class: 'h-fit text-pretty my-1 ',
      }, () => ['Número de Cancelamentos', h(CaretSortIcon, {class: ''})]);
    },
    cell: ({row}) => row.getValue('unsubscribes'),
  }),
  columnHelper.accessor('softbounces', {
    header({column}) {
      return h(Button, {
        variant: 'ghost',
        onClick: () => {
          orderId.value = 'softbounces';
          applyFilter();
        },
        class: 'h-fit text-pretty my-1',
      }, () => ['Número de Bounces', h(CaretSortIcon, {class: ''})]);
    },
    cell: ({row}) => row.getValue('softbounces'),
  }),

  columnHelper.accessor('rate_opens', {
    header: 'Taxa de Abertura (%)',
    cell: ({row}) => `${row.getValue('rate_opens')}%`,
  }),
  columnHelper.accessor('rate_opens_click', {
    header: 'Taxa de Abertura para Clique (%)',
    cell: ({row}) => `${row.getValue('rate_opens_click')}%`,
  }),
  columnHelper.accessor('rate_clicks', {
    header: 'Taxa de Cliques (%)',
    cell: ({row}) => `${row.getValue('rate_clicks')}%`,
  }),
  columnHelper.accessor('rate_unsubscriptions', {
    header: 'Taxa de Cancelamento de Inscrições (%)',
    cell: ({row}) => `${row.getValue('rate_unsubscriptions')}%`,
  }),
  columnHelper.accessor('rate_rejections', {
    header: 'Taxa de Rejeição (%)',
    cell: ({row}) => `${row.getValue('rate_rejections')}%`,
  }),

];


const table = useVueTable({
  campaigns,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  state: {
    columnPinning: {
      left: ['status'],
    },
  },
})
onMounted(() => {
  fetchFilters().then(() => {
    if (selectedFilterId.value) {
      applyFilter();
    }
  });
});
type CampaignMetrics = {
  formatted_date: string; // Data formatada
  id: string; // ID da campanha
  ldate: string; // Data original no formato ISO
  name: string; // Nome da campanha
  rate_clicks: number; // Taxa de cliques
  rate_opens: number; // Taxa de aberturas
  rate_opens_click: number; // Relação entre aberturas e cliques
  rate_rejections: number; // Taxa de rejeições
  rate_unsubscriptions: number; // Taxa de descadastramento
  send_amt: number; // Total de envios
  softbounces: number; // Número de bounces leves
  subscriberclicks: number; // Número de cliques únicos
  uniqueopens: number; // Número de aberturas únicas
  unsubscribes: number; // Número de descadastramentos
};

</script>
