<template>
  <div class="space-y-6 sm:p-10 p-1 max-w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Active Campaign</h2>
      <p class="text-muted-foreground">
        Métricas baseadas nas campanhas do Active Campaign.
      </p>
    </div>

    <div
      v-if="projectFilters && projectFilters.length"
      class="flex sm:flex-row flex-col w-full items-start gap-2"
    >
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
      <DateRangePicker v-model="selectedRange" class="" />
      <Button class="sm:w-fit w-full" @click="applyFilter">Filtrar</Button>
    </div>
    <div>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomDataTable
            :data="campaigns"
            :columns="columns"
            :loading="loading"
            :update-text="handlerText"
            :find="applyFilter"
            :result="campaignsStats"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, watch } from "vue";
import { useProjectStore } from "@/stores/project";
import api from "@/services/api";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
const projectStore = useProjectStore();
const projectFilters = ref([]);
const selectedFilterId = ref(projectStore.selectedProject);
const loadingFilters = ref(true);
const orderId = ref();
const order = ref(false);
const loading = ref(true);
const campaigns = ref<CampaignMetrics[]>([]);
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

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

const name = ref();
const handlerText = (text: string) => {
  name.value = text;
};
const applyFilter = async (current: number) => {
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
    const response = await api.post(
      `/utils/active-campaign?page=${current ? current : pages.value.current}`,
        {
          start_date: selectedRange.value.start?.toString(),
          end_date: selectedRange.value.end?.toString(),
          filter_id: selectedFilterId.value,
          order_by: orderId.value,
          type_order: order.value ? "asc" : "desc",
          campaign_name: name.value,
        }

    );

    campaigns.value = response.data.data.campaigns.campaigns;
    pages.value = {
      current: response.data.data.campaigns.pagination.current_page,
      total: response.data.data.campaigns.pagination.total,
      last: response.data.data.campaigns.pagination.last_page,
    };
  } catch (error) {
    console.log(error);
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
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
    cell: ({ row }) => h("div", { class: "" }, row.getValue("send_amt")),
  }),
  columnHelper.accessor("uniqueopens", {
    header({ column }) {
      return createHeaderButton("Número de Aberturas", "uniqueopens");
    },
    cell: ({ row }) => h("div", { class: "" }, row.getValue("uniqueopens")),
  }),
  columnHelper.accessor("subscriberclicks", {
    header({ column }) {
      return createHeaderButton("Número de Cliques", "subscriberclicks");
    },
    cell: ({ row }) =>
      h("div", { class: "" }, row.getValue("subscriberclicks")),
  }),
  columnHelper.accessor("unsubscribes", {
    header({ column }) {
      return createHeaderButton("Número de Cancelamentos", "unsubscribes");
    },
    cell: ({ row }) => h("div", { class: "" }, row.getValue("unsubscribes")),
  }),
  columnHelper.accessor("softbounces", {
    header({ column }) {
      return createHeaderButton("Número de Bounces", "softbounces");
    },
    cell: ({ row }) => h("div", { class: "" }, row.getValue("softbounces")),
  }),
  columnHelper.accessor("rate_opens", {
    header: "Taxa de Abertura (%)",
    cell: ({ row }) =>
      h(
        "div",
        { class: "" },
        row.getValue("send_amt") - row.getValue("softbounces") === 0
          ? "0%"
          : (
              (row.getValue("uniqueopens") /
                (row.getValue("send_amt") - row.getValue("softbounces"))) *
              100
            ).toFixed(2) + "%"
      ),
  }),
  columnHelper.accessor("rate_opens_click", {
    header: "Taxa de Abertura para Clique (%)",
    cell: ({ row }) =>
      h(
        "div",
        { class: "" },
        row.getValue("uniqueopens") === 0
          ? "0%"
          : (
              (row.getValue("subscriberclicks") / row.getValue("uniqueopens")) *
              100
            ).toFixed(2) + "%"
      ),
  }),
  columnHelper.accessor("rate_clicks", {
    header: "Taxa de Cliques (%)",
    cell: ({ row }) =>
      h(
        "div",
        { class: "" },
        row.getValue("send_amt") - row.getValue("softbounces") === 0
          ? "0%"
          : (
              (row.getValue("subscriberclicks") /
                (row.getValue("send_amt") - row.getValue("softbounces"))) *
              100
            ).toFixed(2) + "%"
      ),
  }),
  columnHelper.accessor("rate_unsubscriptions", {
    header: "Taxa de Cancelamento de Inscrições (%)",
    cell: ({ row }) =>
      h(
        "div",
        { class: "" },
        row.getValue("send_amt") - row.getValue("softbounces") === 0
          ? "0%"
          : (
              (row.getValue("unsubscribes") /
                (row.getValue("send_amt") - row.getValue("softbounces"))) *
              100
            ).toFixed(2) + "%"
      ),
  }),
  columnHelper.accessor("rate_rejections", {
    header: "Taxa de Rejeição (%)",
    cell: ({ row }) =>
      h(
        "div",
        { class: "" },
        row.getValue("send_amt") === 0
          ? "0%"
          : (
              (row.getValue("softbounces") / row.getValue("send_amt")) *
              100
            ).toFixed(2) + "%"
      ),
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

onMounted(() => {
  fetchFilters().then(() => {
    if (selectedFilterId.value) {
      applyFilter();
    }
  });
});
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
