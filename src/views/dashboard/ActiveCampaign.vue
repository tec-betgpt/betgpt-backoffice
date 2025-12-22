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

        <CardContent class="mt-5">
          <CustomDataTable
            :data="campaigns"
            :columns="columns"
            :loading="loading"
            :update-text="setSearch"
            :find="applyFilter"
            :result="campaignsStats"
            :footer="true"
            :head="totalCampaigns"
            :formatters="formatters"
            :search-fields="[
              {
                key: 'campaign_name',
                placeholder: 'Buscar por titulo da campanha...',
                label: 'Titulo da campanha',
              },
              {
                key: 'campaign_rawtext',
                placeholder: 'Buscar por conteúdo do e-mail...',
                label: 'Conteúdo do e-mail',
              },
              {
                key: 'last_send_date',
                type: 'date-range',
                label: 'Data do último envio',
                placeholder: 'Filtrar por última data de envio',
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

    <div
      :class="[
        'grid gap-3 sm:grid-cols-1',
        {
          'md:grid-cols-2': Object.keys(limitsCards).length === 2,
          'md:grid-cols-3': Object.keys(limitsCards).length >= 3,
        },
      ]"
    >

      <Card v-for="limit in limitsCards">
        <CardHeader>
          <CardTitle>
            <div class="flex justify-between items-center">
              <div>Status do {{getAccountName(limit.project_id)}}</div>
              <Button variant="outline">
                <a target="_blank" :href="`https://${getAccountName(limit.project_id)}.activehosted.com/admin/`">
                  Abrir
                </a>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid space-y-2">
            <span class="">Limite de contatos</span>
            <Progress  :model-value="(limit.qt_contact/limit.limit_contact)*100"  class="w-full"/>
            <p class="text-sm">Faltam {{limit.qt_limit_exceeded}}</p>
          </div>
          <Separator class="my-2"/>
          <div class="grid space-y-2">
            <span class="">Limite de envio</span>
            <Progress  :model-value="(limit.qt_mail_sent/limit.qt_mail_limits)*100"  class="w-full"/>
            <p class="text-sm">Faltam {{limit.qt_mail_exceeded}}</p>
          </div>
        </CardContent>
      </Card>
    </div>
    <!-- Modal de Preview do E-mail -->
    <Dialog v-model:open="showEmailModal">
      <DialogContent
        class="sm:max-w-[800px] max-h-[90vh] grid-rows-[auto_minmax(0,1fr)_auto] p-0"
      >
        <DialogHeader class="p-6 pb-2">
          <DialogTitle>Preview do E-mail</DialogTitle>
          <DialogDescription>
            Visualização do conteúdo do e-mail: {{ selectedCampaign?.name }}
            <span class="text-sm text-muted-foreground ml-2">
              ({{ currentEmailIndex + 1 }} de {{ filteredCampaigns.length }})
            </span>
          </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-hidden p-6 pb-0 pt-0">
          <div
            v-if="loadingEmail"
            class="flex items-center justify-center h-64"
          >
            <div class="flex flex-col items-center gap-2">
              <LucideSpinner class="h-8 w-8 animate-spin" />
              <p class="text-muted-foreground">Carregando preview...</p>
            </div>
          </div>

          <div
            v-else-if="emailHtml"
            class="h-full border rounded-lg overflow-hidden"
          >
            <iframe
              ref="emailIframe"
              class="w-full h-[600px] border-0 bg-white"
              :srcdoc="emailHtml"
              title="Preview do E-mail"
            />
          </div>

          <div v-else class="flex items-center justify-center h-64">
            <p class="text-muted-foreground">
              Nenhum conteúdo disponível para visualização.
            </p>
          </div>
        </div>

        <DialogFooter class="p-6 pt-0 flex justify-between">
          <div class="flex gap-2">
            <Button
              variant="outline"
              @click="navigateEmail('prev')"
              :disabled="currentEmailIndex === 0 || loadingEmail"
            >
              <ArrowLeft class="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <Button
              variant="outline"
              @click="navigateEmail('next')"
              :disabled="
                currentEmailIndex === filteredCampaigns.length - 1 ||
                loadingEmail
              "
            >
              Próximo
              <ArrowRight class="h-4 w-4 ml-2" />
            </Button>
          </div>

          <Button
            v-if="emailHtml"
            variant="secondary"
            @click="editTemplateModal(selectedCampaign!.project_id)"
          >
            Editar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, watch, nextTick } from "vue";
import ActiveCampaign from "@/services/activeCampaign";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Button } from "@/components/ui/button";
import moment from "moment";
import "moment/dist/locale/pt-br";
import { useToast } from "@/components/ui/toast/use-toast";
import { CaretSortIcon } from "@radix-icons/vue";

import { createColumnHelper } from "@tanstack/vue-table";
import DateRangePicker from "@/components/custom/DateRangePicker.vue";

import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  ChevronDownIcon,
  ExternalLink,
  Eye,
  Loader2 as LucideSpinner,
} from "lucide-vue-next";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });
const { toast } = useToast();

import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import {Separator} from "@/components/ui/separator";

const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();

const orderId = ref();
const order = ref(false);
const loading = ref(true);
const campaigns = ref<CampaignMetrics[]>([]);
const integrations = ref<Record<number, Integration>>({});
const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});
const perPages = ref(10);

const showEmailModal = ref(false);
const loadingEmail = ref(false);
const emailHtml = ref("");
const selectedCampaign = ref<CampaignMetrics | null>(null);
const emailIframe = ref<HTMLIFrameElement | null>(null);
const currentEmailIndex = ref(0);
const limitsCards = ref<{
  project_id: number;
  qt_contact: number;
  limit_contact: number;
  qt_limit_exceeded: number;
  qt_mail_limits: number;
  qt_mail_sent: number;
  qt_mail_exceeded: number;
}[]>([])
const backendCampaignTotals = ref();
const campaignsData = ref<CampaignMetrics[]>([]);

const totalCampaigns = computed(() => {
  if (!backendCampaignTotals.value) return null;

  return {
    message: "Total Geral",
    blank: "",
    send_amt: backendCampaignTotals.value.send_amt || 0,
    uniqueopens: backendCampaignTotals.value.uniqueopens || 0,
    subscriberclicks: backendCampaignTotals.value.subscriberclicks || 0,
    unsubscribes: backendCampaignTotals.value.unsubscribes || 0,
    softbounces: backendCampaignTotals.value.softbounces || 0,
    rate_opens: backendCampaignTotals.value.rate_opens || 0,
    rate_opens_click: backendCampaignTotals.value.rate_opens_click || 0,
    rate_clicks: backendCampaignTotals.value.rate_clicks || 0,
    rate_unsubscriptions: backendCampaignTotals.value.rate_unsubscriptions || 0,
    rate_rejections: backendCampaignTotals.value.rate_rejections || 0,
  };
});

const campaignsStats = computed(() => {
  if (!campaignsData.value.length) {
    return {
      message: "Total da Página",
      blank: "",
      send_amt: 0,
      uniqueopens: 0,
      subscriberclicks: 0,
      unsubscribes: 0,
      softbounces: 0,
      rate_opens: 0,
      rate_opens_click: 0,
      rate_clicks: 0,
      rate_unsubscriptions: 0,
      rate_rejections: 0,
    };
  }

  const totals = {
    message: "Total da Página",
    blank: "",
    send_amt: 0,
    uniqueopens: 0,
    subscriberclicks: 0,
    unsubscribes: 0,
    softbounces: 0,
    rate_opens: 0,
    rate_opens_click: 0,
    rate_clicks: 0,
    rate_unsubscriptions: 0,
    rate_rejections: 0,
  };

  campaignsData.value.forEach((campaign) => {
    totals.send_amt += campaign.send_amt;
    totals.uniqueopens += campaign.uniqueopens;
    totals.subscriberclicks += campaign.subscriberclicks;
    totals.unsubscribes += campaign.unsubscribes;
    totals.softbounces += campaign.softbounces;
  });

  const delivered = totals.send_amt - totals.softbounces;

  totals.rate_opens =
    delivered === 0 ? 0 : (totals.uniqueopens / delivered) * 100;
  totals.rate_opens_click =
    totals.uniqueopens === 0
      ? 0
      : (totals.subscriberclicks / totals.uniqueopens) * 100;
  totals.rate_clicks =
    delivered === 0 ? 0 : (totals.subscriberclicks / delivered) * 100;
  totals.rate_unsubscriptions =
    delivered === 0 ? 0 : (totals.unsubscribes / delivered) * 100;
  totals.rate_rejections =
    totals.send_amt === 0 ? 0 : (totals.softbounces / totals.send_amt) * 100;

  return totals;
});

const hasMemberAccess = computed(() => {
  return authStore.user?.access_type === "member";
});

const filteredCampaigns = computed(() => {
  return campaignsData.value;
});

const navigateEmail = async (direction: "prev" | "next") => {
  if (loadingEmail.value) return;

  let newIndex = currentEmailIndex.value;

  if (direction === "prev" && currentEmailIndex.value > 0) {
    newIndex--;
  } else if (
    direction === "next" &&
    currentEmailIndex.value < filteredCampaigns.value.length - 1
  ) {
    newIndex++;
  } else {
    return;
  }

  loadingEmail.value = true;
  emailHtml.value = "";

  try {
    const campaign = filteredCampaigns.value[newIndex];
    selectedCampaign.value = campaign;
    currentEmailIndex.value = newIndex;

    const response = await ActiveCampaign.getCampaign(
      campaign.project_id,
      campaign.id
    );

    if (response.data && response.data.body) {
      emailHtml.value = response.data.body;
    } else {
      toast({
        title: "Aviso",
        description: "Nenhum conteúdo disponível para este e-mail.",
        variant: "default",
      });
    }
  } catch (error) {
    console.error("Erro ao carregar preview do e-mail:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar o preview do e-mail.",
      variant: "destructive",
    });
  } finally {
    loadingEmail.value = false;
  }
};

const searchValues = ref<Record<string, string>>({});

const setSearch = (values: Record<string, string>) => {
  searchValues.value = { ...values };
};

const getAccountName = (projectId: any) => {
  const integration = integrations.value[projectId];
  return integration.account_name;
};

const getAutomationLink = (campaign: CampaignMetrics) => {
  if (!campaign.automation_id) return null;

  const projectId = campaign.project_id;
  const integration = integrations.value[projectId];

  if (!integration || !integration.account_name) return null;

  return `https://${integration.account_name}.activehosted.com/series/${campaign.automation_id}`;
};

const openEmailPreview = async (campaign: CampaignMetrics) => {
  selectedCampaign.value = campaign;

  const index = campaignsData.value.findIndex((c) => c.id === campaign.id);
  currentEmailIndex.value = index >= 0 ? index : 0;

  showEmailModal.value = true;
  loadingEmail.value = true;
  emailHtml.value = "";

  try {
    const response = await ActiveCampaign.getCampaign(
      campaign.project_id,
      campaign.id
    );

    if (response.data && response.data.body) {
      emailHtml.value = response.data.body;
    } else {
      toast({
        title: "Aviso",
        description: "Nenhum conteúdo disponível para este e-mail.",
        variant: "default",
      });
    }
  } catch (error) {
    console.error("Erro ao carregar preview do e-mail:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar o preview do e-mail.",
      variant: "destructive",
    });
  } finally {
    loadingEmail.value = false;
  }
};

const editTemplateModal = (selectedCampaign: any) => {
  window.open(
    `https://${getAccountName(
      selectedCampaign
    )}.activehosted.com/campaign/editor/?cid=${selectedCampaign?.id}`,
    "_blank"
  );
};

watch(perPages, (newPages) => {
  if (newPages) {
    applyFilter(1);
  }
});

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
      per_pages: perPages.value,
    });

    campaigns.value = data.campaigns.data;
    campaignsData.value = data.campaigns.data;
    backendCampaignTotals.value = data.campaigns.total;
    integrations.value = data.integrations;
    limitsCards.value = data.status
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

const formatPercentage = (value: any): string => {
  const numValue = typeof value === "number" ? value : parseFloat(value || 0);
  return `${(numValue || 0).toFixed(2)}%`;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  return moment(dateString).format("DD/MM/YYYY");
};

const formatters = {
  rate_opens: formatPercentage,
  rate_opens_click: formatPercentage,
  rate_clicks: formatPercentage,
  rate_unsubscriptions: formatPercentage,
  rate_rejections: formatPercentage,
  send_amt: formatNumber,
  uniqueopens: formatNumber,
  subscriberclicks: formatNumber,
  unsubscribes: formatNumber,
  softbounces: formatNumber,
};

const columnHelper = createColumnHelper<CampaignMetrics>();

const actionColumn = columnHelper.accessor("id", {
  header: () => "Ações",
  cell: ({ row, table }) => {
    const campaign = row.original;
    const automationLink = getAutomationLink(campaign);

    return h(DropdownMenu, {}, [
      h(
        DropdownMenuTrigger,
        { asChild: true },
        h(Button, { size: "icon", variant: "ghost" }, [
          h(MoreHorizontal, { class: "h-4 w-4" }),
          h("span", { class: "sr-only" }, "Ações"),
        ])
      ),
      h(
        DropdownMenuContent,
        { align: "end" },
        [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),

          h(
            DropdownMenuItem,
            {
              onClick: () => {
                openEmailPreview(campaign);
              },
            },
            [h("div", {}), "Ver Template"]
          ),

          automationLink
            ? h(
                DropdownMenuItem,
                {
                  onClick: () => {
                    window.open(automationLink, "_blank");
                  },
                },
                [h("div", {}), "Ver Automação"]
              )
            : null,
        ].filter(Boolean)
      ),
    ]);
  },
});

const columns = [
  columnHelper.accessor("name", {
    header() {
      return h("div", { class: "text-pretty text-left py-3 pr-20" }, "Título");
    },
    cell: ({ row }) =>
      h("div", { class: "font-medium" }, row.getValue("name") || "-"),
  }),

  columnHelper.accessor("subject", {
    header() {
      return h("div", { class: "text-pretty text-left py-3 pr-20" }, "Assunto");
    },
    cell: ({ row }) =>
      h("div", { class: "font-medium" }, row.getValue("subject") || "-"),
  }),

  columnHelper.accessor("ldate", {
    header: () => createHeaderButton("Última Data de Envio", "ldate"),
    cell: ({ row }) =>
      h("div", { class: "text-right" }, formatDate(row.getValue("ldate"))),
  }),

  columnHelper.accessor("send_amt", {
    header: () => createHeaderButton("Envios", "send_amt"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("send_amt") || 0)
      ),
  }),

  columnHelper.accessor("uniqueopens", {
    header: () => createHeaderButton("Aberturas", "uniqueopens"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("uniqueopens") || 0)
      ),
  }),

  columnHelper.accessor("subscriberclicks", {
    header: () => createHeaderButton("Cliques", "subscriberclicks"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("subscriberclicks") || 0)
      ),
  }),

  columnHelper.accessor("unsubscribes", {
    header: () => createHeaderButton("Cancelamentos", "unsubscribes"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("unsubscribes") || 0)
      ),
  }),

  columnHelper.accessor("softbounces", {
    header: () => createHeaderButton("Bounces", "softbounces"),
    footer: "sum",
    format: "number",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("softbounces") || 0)
      ),
  }),

  columnHelper.accessor("rate_opens", {
    header: () => createHeaderButton("Taxa de Abertura", "rate_opens"),
    footer: "avg",
    format: "percentage",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("rate_opens") || 0)
      ),
  }),

  columnHelper.accessor("rate_opens_click", {
    header: () =>
      createHeaderButton("Taxa de Abertura para Clique", "rate_opens_click"),
    footer: "avg",
    format: "percentage",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("rate_opens_click") || 0)
      ),
  }),

  columnHelper.accessor("rate_clicks", {
    header: () => createHeaderButton("Taxa de Cliques", "rate_clicks"),
    footer: "avg",
    format: "percentage",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("rate_clicks") || 0)
      ),
  }),

  columnHelper.accessor("rate_unsubscriptions", {
    header: () =>
      createHeaderButton("Taxa de Cancelamento", "rate_unsubscriptions"),
    footer: "avg",
    format: "percentage",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("rate_unsubscriptions") || 0)
      ),
  }),

  columnHelper.accessor("rate_rejections", {
    header: () => createHeaderButton("Taxa de Rejeição", "rate_rejections"),
    footer: "avg",
    format: "percentage",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("rate_rejections") || 0)
      ),
  }),

  ...(hasMemberAccess.value ? [actionColumn] : []),
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
      class: "p-0 text-pretty text-left text-nowrap",
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

watch(selectedRange, () => {
  applyFilter(1);
});

type CampaignMetrics = {
  id: string;
  project_id: number;
  automation_id?: string;
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

type Integration = {
  id: number;
  project_id: number;
  integration_id: number;
  account_name: string;
};
</script>
