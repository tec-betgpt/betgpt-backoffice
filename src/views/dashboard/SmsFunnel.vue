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
      <div class="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
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

      <div class="mt-4 grid gap-4 md:grid-cols-2 sm:grid-cols-1">
        <Card v-for="n in hasMemberAccess ? 6 : 5" :key="n">
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
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <div class="flex justify-between items-center">
              <Avatar
                class="wrapper-avatar mr-3 text-white border-gray-900 h-9 w-9 p-2"
                shape="square"
              >
                <Mail class="text-muted-foreground" />
              </Avatar>
              <CardTitle class="text-sm font-medium">SMS Contratado</CardTitle>
            </div>
            <GlossaryTooltipComponent
              :description="
                meta['sms.contracted'] ||
                'Quantidade total de SMS contratados no período selecionado.'
              "
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ formatNumber(last.sms.contracted) }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <div class="flex justify-between items-center">
              <Avatar
                class="wrapper-avatar mr-3 text-white border-gray-900 h-9 w-9 p-2"
                shape="square"
              >
                <MailCheck class="text-muted-foreground" />
              </Avatar>
              <CardTitle class="text-sm font-medium">SMS Enviado</CardTitle>
            </div>
            <GlossaryTooltipComponent
              :description="
                meta['sms.sent'] ||
                'Quantidade total de SMS enviados no período selecionado.'
              "
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ formatNumber(last.sms.sent) }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <div class="flex justify-between items-center">
              <Avatar
                class="wrapper-avatar mr-3 text-white border-gray-900 h-9 w-9 p-2"
                shape="square"
              >
                <MailPlus class="text-muted-foreground" />
              </Avatar>
              <CardTitle class="text-sm font-medium">SMS Disponivel</CardTitle>
            </div>
            <GlossaryTooltipComponent
              :description="
                meta['sms.available'] ||
                'Quantidade total de SMS disponíveis para envio no período selecionado.'
              "
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ formatNumber(last.sms.available) }}
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mt-4">
        <PeriodComponent
          :period="sms"
          title="SMS Enviados"
          :is-loading="loading"
          :glossary="meta['sms.sent'] || 'Dados de SMS Enviados'"
        />
        <PeriodComponent
          v-if="hasMemberAccess"
          :period="clicks"
          title="Cliques"
          :is-loading="loading"
          :glossary="meta['clicks'] || 'Dados de Cliques'"
        />
      </div>

      <!-- Tabela de Campanhas -->
      <Card class="w-full mt-4">
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomDataTable
            :data="campaigns"
            :columns="filteredCampaignColumns"
            :loading="loading"
            :update-text="setSearchCampaigns"
            :find="applyCampaignFilter"
            :result="campaignsStats"
            :footer="true"
            :head="totalCampaigns"
            :formatters="formatters"
            :search-fields="[
              {
                key: 'name',
                placeholder: 'Buscar por nome da campanha...',
                label: 'Titulo da campanha',
              },
              {
                key: 'body',
                placeholder: 'Buscar por conteúdo da campanha...',
                label: 'Conteúdo da campanha',
              },
            ]"
          />
        </CardContent>
        <CardFooter class="py-4 w-full">
          <CustomPagination
            :pages="{
              current: campaignPages.current,
              last: campaignPages.last,
              total: campaignPages.total,
            }"
            :select-page="applyCampaignFilter"
            :per_pages="campaignPerPage"
            @update:perPages="(args) => (campaignPerPage = args)"
          />
        </CardFooter>
      </Card>

      <!-- Tabela de Broadcasts -->
      <Card class="w-full mt-4">
        <CardHeader>
          <CardTitle>Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomDataTable
            :data="broadcasts"
            :columns="filteredBroadcastColumns"
            :loading="loading"
            :update-text="setSearchBroadcasts"
            :find="applyBroadcastFilter"
            :result="broadcastsStats"
            :footer="true"
            :head="totalBroadcasts"
            :formatters="formatters"
            :search-fields="[
              {
                key: 'name',
                placeholder: 'Buscar por nome do broadcast...',
                label: 'Titulo do broadcast',
              },
              {
                key: 'body',
                label: 'Conteúdo do broadcast',
                placeholder: 'Buscar por conteúdo do broadcast...',
              },
              {
                key: 'last_send_date',
                type: 'date-range',
                placeholder: 'Filtrar por última data de envio',
              },
            ]"
          />
        </CardContent>
        <CardFooter class="py-4 w-full">
          <CustomPagination
            :pages="{
              current: broadcastPages.current,
              last: broadcastPages.last,
              total: broadcastPages.total,
            }"
            :select-page="applyBroadcastFilter"
            :per_pages="broadcastPerPage"
            @update:perPages="(args) => (broadcastPerPage = args)"
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
                <TableHead class="text-right">Créditos</TableHead>
                <TableHead class="text-right">Preço</TableHead>
                <TableHead class="text-right">Valor</TableHead>
                <TableHead class="text-right">Situação</TableHead>
                <TableHead class="text-right">Nota Fiscal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="loading">
                <TableRow v-for="n in 5" :key="`loading-${n}`">
                  <TableCell v-for="j in 8" :key="j">
                    <Skeleton class="h-4 w-full bg-gray-300" />
                  </TableCell>
                </TableRow>
              </template>

              <template v-else>
                <TableRow class="font-bold">
                  <TableCell colspan="3"></TableCell>
                  <TableCell class="text-right">{{
                    rechargesTotal.credits
                  }}</TableCell>
                  <TableCell class="text-right">{{
                    $toCurrency(rechargesTotal.price)
                  }}</TableCell>
                  <TableCell class="text-right">{{
                    $toCurrency(rechargesTotal.total)
                  }}</TableCell>
                  <TableCell class="text-right" colspan="2"></TableCell>
                </TableRow>
                <TableRow v-for="(recharge, index) in recharges" :key="index">
                  <TableCell>{{
                    recharge.created_at
                      ? $moment(recharge.created_at).format(
                          "DD/MM/YYYY HH:mm:ss",
                        )
                      : ""
                  }}</TableCell>
                  <TableCell>{{ recharge.description }}</TableCell>
                  <TableCell>{{ recharge.service }}</TableCell>
                  <TableCell class="text-right">{{
                    recharge.credits
                  }}</TableCell>
                  <TableCell class="text-right">{{
                    $toCurrency(recharge.price)
                  }}</TableCell>
                  <TableCell class="text-right">{{
                    $toCurrency(recharge.total)
                  }}</TableCell>
                  <TableCell class="text-right">
                    <span
                      class="text-green-600"
                      v-if="recharge.situation == 'APPROVED'"
                      >Confirmado</span
                    >
                    <span class="text-red-600" v-else>Pendente</span>
                  </TableCell>
                  <TableCell class="text-right">
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
import { ref, h, watch, computed } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import { createColumnHelper } from "@tanstack/vue-table";
import { CaretSortIcon } from "@radix-icons/vue";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  Mail,
  MailCheck,
  MailPlus,
  Download,
  ArrowDown,
  ArrowUp,
} from "lucide-vue-next";
import SmsFunnel from "@/services/smsFunnel";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const authStore = useAuthStore();

const hasMemberAccess = computed(() => {
  return authStore.user?.access_type === "member";
});

const responsiveClass =
  "grid gap-4 min-[720px]:grid-cols-2 md:gap-8  lg:grid-cols-3 xl:grid-cols-3 mb-3";

const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

const workspaceStore = useWorkspaceStore();

const loading = ref(true);
const last = ref<any>([]);
const daily = ref<any>([]);
const sms = ref<{ name: string; value: number[] }[]>([]);
const clicks = ref<{ name: string; value: number[] }[]>([]);
const recharges = ref([]);
const campaigns = ref([]);
const broadcasts = ref([]);
const meta = ref<Record<string, string>>({});

const campaignOrderId = ref();
const campaignOrder = ref(false);
const campaignPages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const campaignPerPage = ref(10);
const totalCampaigns = ref();
const searchCampaignValues = ref<Record<string, string>>({});

const broadcastOrderId = ref();
const broadcastOrder = ref(false);
const broadcastPages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const broadcastPerPage = ref(10);
const totalBroadcasts = ref();
const searchBroadcastValues = ref<Record<string, string>>({});

const localCampaignSearch = ref<Record<string, string>>({});
const localBroadcastSearch = ref<Record<string, string>>({});

const rechargesTotal = computed(() => {
  return recharges.value.reduce(
    (acc: any, recharge: any) => {
      acc.credits += Number(recharge.credits) || 0;
      acc.price += Number(recharge.price) || 0;
      acc.total += Number(recharge.total) || 0;
      return acc;
    },
    { credits: 0, price: 0, total: 0 },
  );
});

const campaignsStats = computed(() => {
  const totalStats = {
    message: "Total",
    blank: "",
    sms: 0,
    clicks: 0,
    ctr: "0.00",
  };

  campaigns.value.forEach((campaign: any) => {
    totalStats.sms += campaign.sms;
    totalStats.clicks += campaign.clicks;
  });

  totalStats.ctr =
    totalStats.sms > 0
      ? ((totalStats.clicks / totalStats.sms) * 100).toFixed(2)
      : "0.00";

  return totalStats;
});

const broadcastsStats = computed(() => {
  const totalStats = {
    message: "Total",
    blank: "",
    sms: 0,
    clicks: 0,
    ctr: "0.00",
  };

  broadcasts.value.forEach((broadcast: any) => {
    totalStats.sms += broadcast.sms;
    totalStats.clicks += broadcast.clicks;
  });

  totalStats.ctr =
    totalStats.sms > 0
      ? ((totalStats.clicks / totalStats.sms) * 100).toFixed(2)
      : "0.00";

  return totalStats;
});

const setSearchCampaigns = (values: Record<string, string>) => {
  localCampaignSearch.value = values;
};

const setSearchBroadcasts = (values: Record<string, string>) => {
  localBroadcastSearch.value = values;
};

const applyCampaignFilter = async (page = campaignPages.value.current) => {
  searchCampaignValues.value = { ...localCampaignSearch.value };
  campaignPages.value.current = page;
  await loadData();
};

const applyBroadcastFilter = async (page = broadcastPages.value.current) => {
  searchBroadcastValues.value = { ...localBroadcastSearch.value };
  broadcastPages.value.current = page;
  await loadData();
};

const loadData = async () => {
  loading.value = true;
  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um grupo ou projeto antes de filtrar.",
      variant: "destructive",
    });
    loading.value = false;
    return;
  }

  try {
    const searchParams = {
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,

      campaign_page: campaignPages.value.current,
      campaign_per_page: campaignPerPage.value,
      campaign_order_by: campaignOrderId.value,
      campaign_type_order: campaignOrder.value ? "asc" : "desc",
      campaign_search:
        Object.keys(searchCampaignValues.value).length > 0
          ? [searchCampaignValues.value]
          : [],

      broadcast_page: broadcastPages.value.current,
      broadcast_per_page: broadcastPerPage.value,
      broadcast_order_by: broadcastOrderId.value,
      broadcast_type_order: broadcastOrder.value ? "asc" : "desc",
      broadcast_search:
        Object.keys(searchBroadcastValues.value).length > 0
          ? [searchBroadcastValues.value]
          : [],
    };

    const { data } = await SmsFunnel.index(searchParams);

    last.value = data.last;
    daily.value = data.daily;
    sms.value = [{ name: "Total SMS Enviado", value: data.daily.sms }];
    clicks.value = [{ name: "Total Cliques", value: data.daily.clicks }];
    recharges.value = data.recharges;
    meta.value = data.meta || {};

    if (data.campaigns) {
      campaigns.value = data.campaigns.data.map((c: any) => ({
        ...c,
        ctr: c.sms && c.clicks ? ((c.clicks / c.sms) * 100).toFixed(2) : "0.00",
      }));
      totalCampaigns.value = data.campaigns.total;
      campaignPages.value = {
        current: data.campaigns.pagination.current_page,
        total: data.campaigns.pagination.total,
        last: data.campaigns.pagination.last_page,
      };
    }

    if (data.broadcasts) {
      broadcasts.value = data.broadcasts.data.map((b: any) => ({
        ...b,
        ctr: b.sms && b.clicks ? ((b.clicks / b.sms) * 100).toFixed(2) : "0.00",
      }));
      totalBroadcasts.value = data.broadcasts.total;
      broadcastPages.value = {
        current: data.broadcasts.pagination.current_page,
        total: data.broadcasts.pagination.total,
        last: data.broadcasts.pagination.last_page,
      };
    }
  } catch (error) {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  }
  loading.value = false;
};

function createHeaderButton(
  label: string,
  columnKey: string,
  type = "campaigns",
) {
  return h(
    Button,
    {
      variant:
        (type === "campaigns"
          ? campaignOrderId.value
          : broadcastOrderId.value) === columnKey
          ? "default"
          : "ghost",
      onClick: async () => {
        if (type === "campaigns") {
          campaignOrderId.value = columnKey;
          campaignOrder.value = !campaignOrder.value;
          campaignPages.value.current = 1;
        } else {
          broadcastOrderId.value = columnKey;
          broadcastOrder.value = !broadcastOrder.value;
          broadcastPages.value.current = 1;
        }
        await loadData();
      },
      class: "h-fit text-pretty my-1 w-full justify-end",
    },
    () => [
      h("div", { class: "flex items-center justify-end w-full" }, [
        label,
        h(
          (type === "campaigns"
            ? campaignOrderId.value
            : broadcastOrderId.value) === columnKey
            ? (
                type === "campaigns"
                  ? campaignOrder.value
                  : broadcastOrder.value
              )
              ? ArrowDown
              : ArrowUp
            : CaretSortIcon,
          { class: "ml-2" },
        ),
      ]),
    ],
  );
}

const formatPercentage = (value: any): string => {
  const numValue = typeof value === "number" ? value : parseFloat(value || 0);
  return `${(numValue || 0).toFixed(2)}%`;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

const formatters = {
  sms: formatNumber,
  clicks: formatNumber,
};

const columnHelper = createColumnHelper<any>();

const baseCampaignColumns = [
  columnHelper.accessor("name", {
    header: () => "Nome da Campanha",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("sms", {
    header: () => createHeaderButton("Envios SMS", "sms", "campaigns"),
    footer: "sum",
    cell: ({ row }) =>
      h("div", { class: "text-right" }, formatNumber(row.getValue("sms") || 0)),
  }),
];

const clicksCampaignColumn = columnHelper.accessor("clicks", {
  header: () => createHeaderButton("Total de Cliques", "clicks", "campaigns"),
  footer: "sum",
  cell: ({ row }) =>
    h(
      "div",
      { class: "text-right" },
      formatNumber(row.getValue("clicks") || 0),
    ),
});

const ctrCampaignColumn = columnHelper.accessor("ctr", {
  header: () => createHeaderButton("CTR", "ctr", "campaigns"),
  footer: () => "avg",
  format: "percentage",
  cell: ({ row }) =>
    h(
      "div",
      { class: "text-right" },
      formatPercentage(row.getValue("ctr") || 0),
    ),
});

const filteredCampaignColumns = computed(() => {
  if (hasMemberAccess.value) {
    return [...baseCampaignColumns, clicksCampaignColumn, ctrCampaignColumn];
  }
  return baseCampaignColumns;
});

const baseBroadcastColumns = [
  columnHelper.accessor("name", {
    header: () => "Nome do Broadcast",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("sms", {
    header: () => createHeaderButton("Envios SMS", "sms", "broadcasts"),
    footer: "sum",
    cell: ({ row }) =>
      h("div", { class: "text-right" }, formatNumber(row.getValue("sms") || 0)),
  }),
];

const clicksBroadcastColumn = columnHelper.accessor("clicks", {
  header: () => createHeaderButton("Total de Cliques", "clicks", "broadcasts"),
  footer: "sum",
  cell: ({ row }) =>
    h(
      "div",
      { class: "text-right" },
      formatNumber(row.getValue("clicks") || 0),
    ),
});

const ctrBroadcastColumn = columnHelper.accessor("ctr", {
  header: () => createHeaderButton("CTR", "ctr", "broadcasts"),
  footer: () => "avg",
  format: "percentage",
  cell: ({ row }) =>
    h(
      "div",
      { class: "text-right" },
      formatPercentage(row.getValue("ctr") || 0),
    ),
});

const filteredBroadcastColumns = computed(() => {
  if (hasMemberAccess.value) {
    return [...baseBroadcastColumns, clicksBroadcastColumn, ctrBroadcastColumn];
  }
  return baseBroadcastColumns;
});

watch(campaignPerPage, () => {
  campaignPages.value.current = 1;
  loadData();
});

watch(broadcastPerPage, () => {
  broadcastPages.value.current = 1;
  loadData();
});

watch(selectedRange, () => {
  campaignPages.value.current = 1;
  broadcastPages.value.current = 1;
  loadData();
});

loadData();
</script>
