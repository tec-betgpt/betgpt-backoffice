<template>
  <div
    class="google-analytics-page space-y-6 p-10 max-[450px]:p-2 pb-16 w-full"
  >
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Tráfego</h2>
        <p class="text-muted-foreground">
          Relatórios de tráfego de um período específico.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CustomDatePicker v-model="selectedRange" />
      </div>
    </div>

    <div>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Aquisição de Tráfego</CardTitle>
        </CardHeader>

        <Separator />

        <CardContent class="mt-5">
          <CustomDataTable
            :data="groupSessionsData"
            :columns="columns"
            :loading="loading"
            :update-text="setSearch"
            :find="applyFilter"
            :result="groupSessionsStats"
            :footer="true"
            :head="totalGroupSessions"
            :formatters="formatters"
            :search-fields="[
              {
                key: 'channel',
                placeholder: 'Buscar por canal...',
                label: 'Canal',
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

    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1">
      <PeriodComponent
        :is-loading="loading"
        :period="usersPeriod"
        title="Usuários"
        glossary="Dados de Usuários novos e ativo"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="payingActivePeriod"
        title="Usuários Ativos Pagantes por período"
        glossary="Dados de Pagantes Ativos por período, com diferença de 7D, 14D e 28D"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="totalUsersPeriod"
        title="Total de Usuários"
        glossary="Dados de total de usuários"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="returningUsersPeriod"
        title="Usuários Recorrentes"
        glossary="Dados de Usuários Recorrentes por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="firstTimePurchasersPeriod"
        title="Total de Primeiros Compradores"
        glossary="Dados de Primeiros Compradores por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="engagementRatePeriod"
        title="Taxa de Engajamento por período"
        type="percent"
        glossary="Percentual de usuários engajados por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="arpuPeriod"
        title="ARPU"
        type="currency"
        glossary="Receita média por usuário ativo por período"
      />
      <PeriodComponent
        :is-loading="loading"
        :period="arppuPeriod"
        title="ARPPU"
        type="currency"
        glossary="Receita média por usuário pagante por período"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from "vue";
import GoogleAnalytics from "@/services/googleAnalytics";
import { getLocalTimeZone, today } from "@internationalized/date";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { createColumnHelper } from "@tanstack/vue-table";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, ArrowDown, ArrowUp } from "lucide-vue-next";

const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

const currentDate = today(getLocalTimeZone());
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({
  start: startDate,
  end: currentDate,
});

const loading = ref(false);
const usersPeriod = ref<{ name: string; value: number[] }[]>([]);
const totalUsersPeriod = ref<{ name: string; value: number[] }[]>([]);
const returningUsersPeriod = ref<{ name: string; value: number[] }[]>([]);
const firstTimePurchasersPeriod = ref<{ name: string; value: number[] }[]>([]);
const payingActivePeriod = ref<{ name: string; value: number[] }[]>([]);
const engagementRatePeriod = ref<{ name: string; value: number[] }[]>([]);
const totalRevenuePeriod = ref<{ name: string; value: number[] }[]>([]);
const engagementDurationSessionPeriod = ref<
  { name: string; value: number[] }[]
>([]);
const arppuPeriod = ref<{ name: string; value: number[] }[]>([]);
const arpuPeriod = ref<{ name: string; value: number[] }[]>([]);

const groupSessionsData = ref<GroupSession[]>([]);

const totalGroupSessions = computed(() => {
  if (!backendTotals.value) return null;

  return {
    channel: "Total Geral",
    sessions: backendTotals.value.sessions || 0,
    engagedSessions: backendTotals.value.engagedSessions || 0,
    engagementRate: backendTotals.value.engagementRate || 0,
    averageEngagementDuration:
      backendTotals.value.averageEngagementDuration || 0,
    eventsPerSession: backendTotals.value.eventsPerSession || 0,
    eventCount: backendTotals.value.eventCount || 0,
    keyEvents: backendTotals.value.keyEvents || 0,
    sessionKeyEventRate: backendTotals.value.sessionKeyEventRate || 0,
    totalRevenue: backendTotals.value.totalRevenue || 0,
    variation: variationTotal.value,
  };
});

const groupSessionsStats = computed(() => {
  if (!groupSessionsData.value.length) {
    return {
      channel: "Total da Página",
      sessions: 0,
      engagedSessions: 0,
      engagementRate: 0,
      averageEngagementDuration: 0,
      eventsPerSession: 0,
      eventCount: 0,
      keyEvents: 0,
      sessionKeyEventRate: 0,
      totalRevenue: 0,
    };
  }

  const totals = {
    channel: "Total da Página",
    sessions: 0,
    engagedSessions: 0,
    engagementRate: 0,
    averageEngagementDuration: 0,
    eventsPerSession: 0,
    eventCount: 0,
    keyEvents: 0,
    sessionKeyEventRate: 0,
    totalRevenue: 0,
  };

  groupSessionsData.value.forEach((item) => {
    totals.sessions += item.sessions || 0;
    totals.engagedSessions += item.engagedSessions || 0;
    totals.eventCount += item.eventCount || 0;
    totals.keyEvents += item.keyEvents || 0;
    totals.totalRevenue += item.totalRevenue || 0;
    totals.engagementRate += item.engagementRate || 0;
    totals.averageEngagementDuration += item.averageEngagementDuration || 0;
    totals.eventsPerSession += item.eventsPerSession || 0;
    totals.sessionKeyEventRate += item.sessionKeyEventRate || 0;
  });

  const count = groupSessionsData.value.length;
  totals.engagementRate = count > 0 ? totals.engagementRate / count : 0;
  totals.averageEngagementDuration =
    count > 0 ? totals.averageEngagementDuration / count : 0;
  totals.eventsPerSession = count > 0 ? totals.eventsPerSession / count : 0;
  totals.sessionKeyEventRate =
    count > 0 ? totals.sessionKeyEventRate / count : 0;

  return totals;
});

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPages = ref(10);
const orderId = ref("sessions");
const order = ref(false);

const searchValues = ref<Record<string, string>>({
  "search[1][channel]": "",
});

const isFirstLoad = ref(true);

const setSearch = (values: Record<string, string>) => {
  searchValues.value = { ...searchValues.value, ...values };
};

const formatDateForAPI = (date: any): string => {
  if (!date) return "";

  if (
    date &&
    typeof date === "object" &&
    "year" in date &&
    "month" in date &&
    "day" in date
  ) {
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(
      date.day
    ).padStart(2, "0")}`;
  }

  if (typeof date === "string") {
    return date;
  }

  return "";
};

const backendTotals = ref();
const variationTotal = ref(0);

const applyFilter = async (current = pages.value.current) => {
  if (loading.value) return;

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
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      if (searchValues.value[key]) {
        acc[key] = searchValues.value[key];
      }
      return acc;
    }, {} as Record<string, string>);

    const channelSearch = searchValues.value["search[1][channel]"];

    const startDateFormatted = formatDateForAPI(selectedRange.value.start);
    const endDateFormatted = formatDateForAPI(selectedRange.value.end);

    console.log("Datas enviadas para API:", {
      start: startDateFormatted,
      end: endDateFormatted,
      selectedRange: selectedRange.value,
    });

    const params: any = {
      page: current,
      ...searchParams,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      filter_id: workspaceStore.activeGroupProject.id,
      order_by: orderId.value,
      type_order: order.value ? "asc" : "desc",
      per_pages: perPages.value,
    };

    if (channelSearch && channelSearch.trim() !== "") {
      params.search = channelSearch.trim();
    }

    const { data } = await GoogleAnalytics.index(params);

    groupSessionsData.value = data.group_sessions?.data || [];
    backendTotals.value = data.group_sessions?.total || {};
    variationTotal.value = data.group_sessions?.variation_total || 0;

    if (data.group_sessions?.pagination) {
      pages.value = {
        current: data.group_sessions.pagination.current_page || 1,
        total: data.group_sessions.pagination.total || 0,
        last: data.group_sessions.pagination.last_page || 1,
      };
    }

    usersPeriod.value = [
      { name: "Usuários Novos", value: data.users_period || [] },
      { name: "Usuários Ativos", value: data.users_period || [] },
    ];
    totalUsersPeriod.value = [
      { name: "Total de Usuários", value: data.total_users_period || [] },
    ];
    returningUsersPeriod.value = [
      {
        name: "Usuários Recorrentes",
        value: data.returning_users_period || [],
      },
    ];
    firstTimePurchasersPeriod.value = [
      {
        name: "Primeiros Compradores",
        value: data.first_time_purchasers_period || [],
      },
    ];
    payingActivePeriod.value = [
      { name: "7 Dias", value: data.paying_active_period || [] },
      { name: "14 Dias", value: data.paying_active_period || [] },
      { name: "28 Dias", value: data.paying_active_period || [] },
    ];
    engagementRatePeriod.value = [
      {
        name: "% Taxa de Engajamento",
        value: data.engagement_rate_period || [],
      },
    ];
    totalRevenuePeriod.value = [
      { name: "Receita", value: data.total_revenue || [] },
    ];
    engagementDurationSessionPeriod.value = [
      {
        name: "Tempo médio",
        value: data.engagement_duration_per_sessions || [],
      },
    ];
    arppuPeriod.value = [{ name: "ARPPU", value: data.arppu || [] }];
    arpuPeriod.value = [{ name: "ARPU", value: data.arpu || [] }];
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível aplicar o filtro selecionado.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
    isFirstLoad.value = false;
  }
};

const formatDuration = (seconds: number): string => {
  if (!seconds) return "0s";

  const duration = {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: Math.floor(seconds % 60),
  };

  if (duration.hours > 0) {
    return `${duration.hours}h ${duration.minutes}min ${duration.seconds}s`;
  } else if (duration.minutes > 0) {
    return `${duration.minutes}min ${duration.seconds}s`;
  } else {
    return `${duration.seconds}s`;
  }
};

const formatEventsPerSession = (value: number): string => {
  const decimalValue = (value || 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimalValue);
};

const formatPercentage = (value: number): string => {
  return `${(value || 0).toFixed(2)}%`;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const columnHelper = createColumnHelper<GroupSession>();

function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: orderId.value === columnKey ? "default" : "ghost",
      onClick: () => {
        orderId.value = columnKey;
        order.value = !order.value;
        applyFilter(1);
      },
      class: "p-0 text-pretty text-left text-nowrap",
    },
    () => [
      label,
      h(
        orderId.value === columnKey
          ? order.value
            ? ArrowDown
            : ArrowUp
          : ChevronsUpDown,
        { class: "" }
      ),
    ]
  );
}

const formatters = {
  averageEngagementDuration: formatDuration,
  eventsPerSession: formatEventsPerSession,
  totalRevenue: formatCurrency,
  engagementRate: formatPercentage,
  sessionKeyEventRate: formatPercentage,
  variation: formatPercentage,
  sessions: formatNumber,
  engagedSessions: formatNumber,
  eventCount: formatNumber,
  keyEvents: formatNumber,
};

const columns = [
  columnHelper.accessor("channel", {
    header: () => createHeaderButton("Grupo", "channel"),
    cell: ({ row }) =>
      h("div", { class: "font-medium" }, row.getValue("channel") || "-"),
  }),

  columnHelper.accessor("sessions", {
    header: () => createHeaderButton("Sessões", "sessions"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("sessions") || 0)
      ),
  }),

  columnHelper.accessor("variation", {
    header: () => createHeaderButton("Variação", "variation"),
    format: "percentage",
    cell: ({ row }) => {
      const variation = row.getValue("variation") as number;
      return h(
        "div",
        {
          class: `text-right flex items-center justify-end gap-1 ${
            variation > 0
              ? "text-green-600"
              : variation < 0
              ? "text-red-600"
              : "text-gray-500"
          }`,
        },
        [
          h("span", variation > 0 ? "▲" : variation < 0 ? "▼" : "—"),
          h("span", `${Math.abs(variation || 0).toFixed(2)}%`),
        ]
      );
    },
  }),

  columnHelper.accessor("engagedSessions", {
    header: () => createHeaderButton("Sessões Engajadas", "engagedSessions"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("engagedSessions") || 0)
      ),
  }),

  columnHelper.accessor("engagementRate", {
    header: () => createHeaderButton("Taxa de Engajamento", "engagementRate"),
    footer: "avg",
    format: "percentage",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("engagementRate") as number)
      ),
  }),

  columnHelper.accessor("averageEngagementDuration", {
    header: () =>
      createHeaderButton(
        "Tempo Médio de Engajamento",
        "averageEngagementDuration"
      ),
    footer: "avg",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatDuration(row.getValue("averageEngagementDuration") as number)
      ),
  }),

  columnHelper.accessor("eventsPerSession", {
    header: () => createHeaderButton("Eventos por Sessão", "eventsPerSession"),
    footer: "avg",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatEventsPerSession(row.getValue("eventsPerSession") as number)
      ),
  }),

  columnHelper.accessor("eventCount", {
    header: () => createHeaderButton("Contagem de Eventos", "eventCount"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("eventCount") || 0)
      ),
  }),

  columnHelper.accessor("keyEvents", {
    header: () => createHeaderButton("Eventos Principais", "keyEvents"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("keyEvents") || 0)
      ),
  }),

  columnHelper.accessor("sessionKeyEventRate", {
    header: () =>
      createHeaderButton("Taxa de Eventos Principais", "sessionKeyEventRate"),
    footer: "avg",
    format: "percentage",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("sessionKeyEventRate") as number)
      ),
  }),

  columnHelper.accessor("totalRevenue", {
    header: () => createHeaderButton("Receita Total", "totalRevenue"),
    footer: "sum",
    format: "currency",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatCurrency(row.getValue("totalRevenue") as number)
      ),
  }),
];

type GroupSession = {
  channel: string;
  sessions: number;
  variation: number;
  engagedSessions: number;
  engagementRate: number;
  averageEngagementDuration: number;
  eventsPerSession: number;
  eventCount: number;
  keyEvents: number;
  sessionKeyEventRate: number;
  totalRevenue: number;
};

watch(
  selectedRange,
  () => {
    if (!isFirstLoad.value) {
      applyFilter(1);
    }
  },
  { deep: true }
);

watch(perPages, (newPages) => {
  if (!isFirstLoad.value && newPages) {
    applyFilter(1);
  }
});

onMounted(() => {
  setTimeout(() => {
    applyFilter(1);
  }, 100);
});
</script>
