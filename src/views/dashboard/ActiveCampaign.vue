<template>
  <div class="space-y-6 sm:p-10 p-1 max-w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">E-mails</h2>
        <p class="text-muted-foreground">
          Relatórios de envio por e-mails de um período específico.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CustomDatePicker v-model="selectedRange" />
      </div>
    </div>

    <div>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>

        <Separator />

        <CardContent>
          <CustomDataTable
            :data="campaigns"
            :columns="columns"
            :loading="loading"
            :update-text="setSearch"
            :find="applyFilter"
            :result="campaignsStats"
            :footer="true"
            :head="totalCampaigns"
            :search-fields="[
              {
                key: 'campaign_name',
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
            @update:perPages="(value) => (perPages = value)"
            :per_pages="perPages"
          />
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, watch } from "vue";
import ActiveCampaign from "@/services/activeCampaign";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Button } from "@/components/ui/button";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import { CaretSortIcon } from "@radix-icons/vue";

import { createColumnHelper } from "@tanstack/vue-table";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";

import { ArrowDown, ArrowUp } from "lucide-vue-next";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";

const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

import { useWorkspaceStore } from "@/stores/workspace";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
const workspaceStore = useWorkspaceStore();

const orderId = ref();
const order = ref(false);
const loading = ref(true);
const campaigns = ref<CampaignMetrics[]>([]);
const totalCampaigns = ref();
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPages = ref(10);
const campaignsStats = computed(() => {
  const totalStats = {
    message: "Total",
    blank: "",
    send_amt: 0,
    uniqueopens: 0,
    subscriberclicks: 0,
    unsubscribes: 0,
    softbounces: 0,
    rate_opens: "0%",
    rate_opens_click: "0%",
    rate_clicks: "0%",
    rate_unsubscriptions: "0%",
    rate_rejections: "0%",
  };

  campaigns.value.forEach((campaign) => {
    totalStats.send_amt += campaign.send_amt;
    totalStats.uniqueopens += campaign.uniqueopens;
    totalStats.subscriberclicks += campaign.subscriberclicks;
    totalStats.unsubscribes += campaign.unsubscribes;
    totalStats.softbounces += campaign.softbounces;
  });

  const delivered = totalStats.send_amt - totalStats.softbounces;

  totalStats.rate_opens =
    delivered === 0
      ? "0%"
      : ((totalStats.uniqueopens / delivered) * 100).toFixed(2) + "%";

  totalStats.rate_opens_click =
    totalStats.uniqueopens === 0
      ? "0%"
      : ((totalStats.subscriberclicks / totalStats.uniqueopens) * 100).toFixed(
          2
        ) + "%";

  totalStats.rate_clicks =
    delivered === 0
      ? "0%"
      : ((totalStats.subscriberclicks / delivered) * 100).toFixed(2) + "%";

  totalStats.rate_unsubscriptions =
    delivered === 0
      ? "0%"
      : ((totalStats.unsubscribes / delivered) * 100).toFixed(2) + "%";

  totalStats.rate_rejections =
    totalStats.send_amt === 0
      ? "0%"
      : ((totalStats.softbounces / totalStats.send_amt) * 100).toFixed(2) + "%";

  return totalStats;
});

const searchValues = ref<Record<string, string>>({});
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

watch(perPages, (newPages) => {
  if (newPages) {
    applyFilter(1);
  }
})
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

    const { data } = await ActiveCampaign.index({
      page: current,
      ...searchParams,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      filter_id: workspaceStore.activeGroupProject.id,
      order_by: orderId.value,
      type_order: order.value ? "asc" : "desc",
      per_pages: perPages.value
    })

    campaigns.value = data.campaigns.data;
    totalCampaigns.value = data.campaigns.total;
    pages.value = {
      current: data.campaigns.pagination.current_page,
      total: data.campaigns.pagination.total,
      last: data.campaigns.pagination.last_page,
    };
  } catch (error) {
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
  columnHelper.accessor("ldate", {
    header({ column }) {
      return createHeaderButton("Última Data de Envio", "ldate");
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize" },
        moment(row.getValue("ldate")).format("DD/MM/YYYY")
      ),
  }),
  columnHelper.accessor("send_amt", {
    header({ column }) {
      return createHeaderButton("Número de Envios", "send_amt");
    },
    footer: "sum",
    cell: ({ row }) => h("div", { class: "" }, row.getValue("send_amt")),
  }),
  columnHelper.accessor("uniqueopens", {
    header({ column }) {
      return createHeaderButton("Número de Aberturas", "uniqueopens");
    },
    footer: "sum",
    cell: ({ row }) => h("div", { class: "" }, row.getValue("uniqueopens")),
  }),
  columnHelper.accessor("subscriberclicks", {
    header({ column }) {
      return createHeaderButton("Número de Cliques", "subscriberclicks");
    },
    footer: "sum",
    cell: ({ row }) =>
      h("div", { class: "" }, row.getValue("subscriberclicks")),
  }),
  columnHelper.accessor("unsubscribes", {
    header({ column }) {
      return createHeaderButton("Número de Cancelamentos", "unsubscribes");
    },
    footer: "sum",
    cell: ({ row }) => h("div", { class: "" }, row.getValue("unsubscribes")),
  }),
  columnHelper.accessor("softbounces", {
    header({ column }) {
      return createHeaderButton("Número de Bounces", "softbounces");
    },
    footer: "sum",
    cell: ({ row }) => h("div", { class: "" }, row.getValue("softbounces")),
  }),
  columnHelper.accessor("rate_opens", {
    header({ column }) {
      return createHeaderButton("Taxa de Abertura (%)", "rate_opens");
    },
    footer: "avg",
    cell: ({ row }) =>
      h("div", { class: "" }, row.getValue("rate_opens") + "%"),
  }),
  columnHelper.accessor("rate_opens_click", {
    header({ column }) {
      return createHeaderButton(
        "Taxa de Abertura para Clique (%)",
        "rate_opens_click"
      );
    },
    footer: "avg",
    cell: ({ row }) =>
      h("div", { class: "" }, row.getValue("rate_opens_click") + "%"),
  }),
  columnHelper.accessor("rate_clicks", {
    header({ column }) {
      return createHeaderButton("Taxa de Cliques (%)", "rate_clicks");
    },
    footer: "avg",
    cell: ({ row }) =>
      h("div", { class: "" }, row.getValue("rate_clicks") + "%"),
  }),
  columnHelper.accessor("rate_unsubscriptions", {
    header({ column }) {
      return createHeaderButton(
        "Taxa de Cancelamento de Inscrições (%)",
        "rate_unsubscriptions"
      );
    },
    footer: "avg",
    cell: ({ row }) =>
      h("div", { class: "" }, row.getValue("rate_unsubscriptions") + "%"),
  }),
  columnHelper.accessor("rate_rejections", {
    header({ column }) {
      return createHeaderButton("Taxa de Rejeição (%)", "rate_rejections");
    },
    footer: "avg",
    cell: ({ row }) =>
      h("div", { class: "" }, row.getValue("rate_rejections") + "%"),
  }),
];

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


watch(selectedRange,()=>{
  applyFilter(1)
})
type CampaignMetrics = {
  ldate: string;
  name: string;
  rate_clicks: number;
  rate_opens: number;
  rate_opens_click: number;
  rate_rejections: number;
  rate_unsubscriptions: number;
  send_amt: number;
  softbounces: number;
  subscriberclicks: number;
  uniqueopens: number;
  unsubscribes: number;
};
</script>
