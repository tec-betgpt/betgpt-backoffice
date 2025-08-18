<template>
  <div class="sms-funnel-page space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">SMS Insights</h2>
        <p class="text-muted-foreground">
          Relatórios de envio por SMS de um período específico.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CustomDatePicker v-model="selectedRange" />
      </div>
    </div>

    <div v-if="loading">
      <div  class="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
        <Card v-for="n in 3" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-8 w-2/3 mb-2" />
          </div>
        </Card>
      </div>

      <div  class="mt-4 grid gap-4 md:grid-cols-2 sm:grid-cols-1">
        <Card v-for="n in 6" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-64 w-3/3 mb-2" />
          </div>
        </Card>
      </div>
    </div>

    <div v-else>
      <div class="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">SMS Contratado</CardTitle>
            <Mail class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+{{ last.sms.contracted }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">SMS Enviado</CardTitle>
            <MailCheck class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+{{ last.sms.sent }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">SMS Disponível</CardTitle>
            <MailPlus class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+{{ last.sms.available }}</div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mt-4">
        <PeriodComponent :period="sms" title="SMS Enviados" :isLoading="loading" />
        <PeriodComponent :period="clicks" title="Cliques" :isLoading="loading" />

      </div>

      <Card class="w-full mt-4">
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomDataTable
            :data="campaigns"
            :columns="columns"
            :loading="loading"
            :update-text="setSearch"
            :find="applyFilter"
            :search-fields="[
              {
                key: 'name',
                placeholder: 'Buscar por nome da campanha...',
              },
            ]"
          />
        </CardContent>
        <CardFooter class="py-4 w-full">
          <CustomPagination
            :pages="{
              current: pages.current,
              last: pages.last,
              total: pages.total,
            }"
            :select-page="applyFilter"
          />
        </CardFooter>
      </Card>

      <Card class="w-full mt-4">
        <CardHeader>
          <CardTitle>Últimas Recargas</CardTitle>
        </CardHeader>

        <Separator />

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
                <TableHead>Nota Fiscal</TableHead>
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
                  <TableCell
                    ><Skeleton class="h-4 w-full bg-gray-300"
                  /></TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow v-for="(recharge, index) in recharges" :key="index">
                  <TableCell>
                    {{ recharge.created_at ? $moment(recharge.created_at).format("DD/MM/YYYY HH:mm:ss") : '' }}
                  </TableCell>
                  <TableCell>{{ recharge.description }}</TableCell>
                  <TableCell>{{ recharge.service }}</TableCell>
                  <TableCell>{{ recharge.credits }}</TableCell>
                  <TableCell>{{ $toCurrency(recharge.price) }}</TableCell>
                  <TableCell>{{ $toCurrency(recharge.total) }}</TableCell>
                  <TableCell>
                    <span v-if="recharge.situation === null"></span>
                    <span
                      class="text-green-600"
                      v-else-if="recharge.situation == 'APPROVED'"
                      >Confirmado</span
                    >
                    <span class="text-red-600" v-else>Pendente</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      v-if="recharge.invoice_url"
                      variant="outline"
                      @click="redirectToInvoiceUrl(recharge.invoice_url)"
                    >
                      <Download class="w-4 h-4" />
                    </Button>
                    <span v-else>-</span>
                  </TableCell>
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
import {ref, onMounted, h, watch} from "vue";
import SmsFunnel from "@/services/smsFunnel";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/chart-line";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast/use-toast";
import CustomChartTooltip from "@/components/custom/CustomChartTooltip.vue";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  Mail,
  MailCheck,
  MailPlus,
  Download,
  ArrowDown,
  ArrowUp, ChartLine,
} from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";

const responsiveClass =
  "grid gap-4 min-[720px]:grid-cols-2 md:gap-8  lg:grid-cols-3 xl:grid-cols-3 mb-3";

const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

import { useWorkspaceStore } from "@/stores/workspace";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";
const workspaceStore = useWorkspaceStore();

const loading = ref(true);
const last = ref([]);
const daily = ref([]);
const sms = ref<{ name: string; value: number[] }[]>([]);
const clicks =ref<{ name: string; value: number[] }[]>([]);
const recharges = ref([]);
const campaigns = ref([]);

const orderId = ref();
const order = ref(false);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

const redirectToInvoiceUrl = (url: any) => {
  window.open(url, "_blank");
};

const searchValues = ref<Record<string, string>>({});
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

const applyFilter = async (current = pages.value.current) => {
  loading.value = true;

  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });
    return;
  }

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      acc[key] = searchValues.value[key];
      return acc;
    }, {} as Record<string, string>);

    const { data } = await SmsFunnel.index({
      page: current,
      ...searchParams,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,
      order_by: orderId.value,
      type_order: order.value ? "asc" : "desc",
    })

    last.value = data.last;
    daily.value = data.daily;
    sms.value = [{name:"Total SMS Enviado",value:data.daily.sms}]
    clicks.value = [{name:"Total Cliques",value:data.daily.clicks}]


    const totalRecharges = {
      name: 'Total',
      description: null,
      situation: null,
      service: null,
      credits: data.recharges.reduce((sum, item) => sum + item.credits, 0),
      price: data.recharges.reduce((sum, item) => sum + item.price, 0),
      total: data.recharges.reduce((sum, item) => sum + item.total, 0),
      created_at: null
    };
    recharges.value = data.recharges;
    recharges.value.push(totalRecharges);

    const totalCampaigns = {
      name: 'Total',
      sms: data.campaigns.data.reduce((sum, campaign) => sum + campaign.sms, 0),
      clicks: data.campaigns.data.reduce((sum, campaign) => sum + campaign.clicks, 0)
    };
    campaigns.value = data.campaigns.data;
    campaigns.value.push(totalCampaigns);

    pages.value = {
      current: data.campaigns.pagination.current_page,
      total: data.campaigns.pagination.total,
      last: data.campaigns.pagination.last_page,
    };
  } catch (error) {
    console.error(error)
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

const columnHelper = createColumnHelper<CampaignMetrics>();
const columns = [
  columnHelper.accessor("name", {
    header({ column }) {
      return "Nome da Campanha";
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("sms", {
    header({ column }) {
      return createHeaderButton("Envios SMS", "sms");
    },
    cell: ({ row }) => h("div", { class: "text-right" }, row.getValue("sms")),
  }),
  columnHelper.accessor("clicks", {
    header({ column }) {
      return createHeaderButton("Total de Cliques", "clicks");
    },
    cell: ({ row }) => h("div", { class: "text-right" }, row.getValue("clicks")),
  }),
];

function calculateStats (key: string, data: Array<any>) {
  if (!data.length) return {}

  const values = data.map((item: any) => item[key])
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = values.reduce((acc: any, val: any) => acc + val, 0) / values.length

  return { max, min, avg: parseFloat(avg).toFixed(2) }
}

function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: orderId.value === columnKey ? "default" : "ghost",
      onClick: () => {
        orderId.value = columnKey;
        order.value = !order.value;
        applyFilter();
      },
      class: "h-fit text-pretty my-1",
    },
    () => [
      label,
      h(
        orderId.value === columnKey
          ? order.value
            ? ArrowDown
            : ArrowUp
          : CaretSortIcon,
        { class: "" }
      ),
    ]
  );
}

onMounted(async () => {
  await applyFilter();
});
watch(selectedRange, () => {
  applyFilter();
})
type CampaignMetrics = {
  name: string;
  sms: number;
  clicks: number;
};
</script>
