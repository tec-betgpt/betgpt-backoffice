<template>
  <div class="call4u-page space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <!-- Header -->
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Ligações Insights</h2>
        <p class="text-muted-foreground">
          Relatórios de ligações de um período específico.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CustomDatePicker v-model="selectedRange" />
      </div>
    </div>

    <!-- Skeleton loading -->
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
        <Card v-for="n in 2" :key="n">
          <div class="p-4 rounded shadow">
            <div class="flex justify-between items-center mb-2">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-5" />
            </div>
            <Skeleton class="h-64 w-full mb-2" />
          </div>
        </Card>
      </div>
    </div>

    <div v-else>
      <!-- Cards de créditos -->
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
                <Phone class="text-muted-foreground" />
              </Avatar>
              <CardTitle class="text-sm font-medium"
                >Ligações Contratadas</CardTitle
              >
            </div>
            <GlossaryTooltipComponent
              description="Quantidade total de ligações contratadas no período selecionado."
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ formatNumber(last?.calls?.contracted ?? 0) }}
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
                <PhoneCall class="text-muted-foreground" />
              </Avatar>
              <CardTitle class="text-sm font-medium"
                >Ligações Enviadas</CardTitle
              >
            </div>
            <GlossaryTooltipComponent
              description="Quantidade total de ligações realizadas no período selecionado."
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ formatNumber(last?.calls?.sent ?? 0) }}
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
                <PhoneMissed class="text-muted-foreground" />
              </Avatar>
              <CardTitle class="text-sm font-medium"
                >Ligações Disponíveis</CardTitle
              >
            </div>
            <GlossaryTooltipComponent
              description="Saldo de ligações disponíveis para uso."
            />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              +{{ formatNumber(last?.calls?.available ?? 0) }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Gráfico diário -->
      <div class="grid gap-4 md:grid-cols-1 sm:grid-cols-1 mt-4">
        <PeriodComponent
          :period="callsChart"
          title="Ligações Enviadas"
          :is-loading="loading"
          glossary="Quantidade de ligações realizadas por dia no período selecionado."
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
            :columns="campaignColumns"
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
                label: 'Nome da campanha',
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
            @update:perPages="(val) => (campaignPerPage = val)"
          />
        </CardFooter>
      </Card>

      <!-- Tabela de Recargas -->
      <Card class="w-full mt-4">
        <CardHeader>
          <CardTitle>Recargas</CardTitle>
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
              <TableRow class="font-bold">
                <TableCell colspan="3" />
                <TableCell class="text-right">{{
                  rechargesTotal.credits
                }}</TableCell>
                <TableCell class="text-right">{{
                  $toCurrency(rechargesTotal.price)
                }}</TableCell>
                <TableCell class="text-right">{{
                  $toCurrency(rechargesTotal.total)
                }}</TableCell>
                <TableCell class="text-right" colspan="2" />
              </TableRow>
              <TableRow v-for="(recharge, index) in recharges" :key="index">
                <TableCell>{{
                  recharge.created_at
                    ? $moment(recharge.created_at).format("DD/MM/YYYY HH:mm:ss")
                    : ""
                }}</TableCell>
                <TableCell>{{ recharge.description }}</TableCell>
                <TableCell>{{ recharge.service }}</TableCell>
                <TableCell class="text-right">{{ recharge.credits }}</TableCell>
                <TableCell
                  class="text-right"
                  :title="'R$ ' + recharge.total / recharge.credits"
                  >{{ $toCurrency(recharge.price) }}</TableCell
                >
                <TableCell class="text-right">{{
                  $toCurrency(recharge.total)
                }}</TableCell>
                <TableCell class="text-right">
                  <span
                    class="text-green-600"
                    v-if="recharge.situation === 'APPROVED'"
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <!-- Modal de Calls da Campanha -->
    <Dialog v-model:open="showCallsModal">
      <DialogContent
        class="sm:max-w-[95vw] xl:max-w-[1200px] max-h-[90vh] grid-rows-[auto_minmax(0,1fr)_auto] p-0"
      >
        <DialogHeader class="p-6 pb-2">
          <DialogTitle>Ligações — {{ selectedCampaign?.name }}</DialogTitle>
          <DialogDescription>
            Detalhamento individual das ligações realizadas nesta campanha no
            período selecionado.
          </DialogDescription>
        </DialogHeader>

        <div class="overflow-y-auto px-6 pb-2 space-y-4">
          <!-- Totalizadores -->
          <div v-if="callsTotals" class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div class="rounded-lg border p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">Total</p>
              <p class="text-lg font-bold">
                {{ formatNumber(callsTotals.total_calls) }}
              </p>
            </div>
            <div class="rounded-lg border p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">Atendidas</p>
              <p class="text-lg font-bold text-green-600">
                {{ formatNumber(callsTotals.total_atendidas) }}
              </p>
            </div>
            <div class="rounded-lg border p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">Não Atendidas</p>
              <p class="text-lg font-bold text-red-500">
                {{ formatNumber(callsTotals.total_nao_atendidas) }}
              </p>
            </div>
            <div class="rounded-lg border p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">Duração Total</p>
              <p class="text-lg font-bold">
                {{ formatDuration(callsTotals.total_seconds_duration) }}
              </p>
            </div>
            <div class="rounded-lg border p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">Duração Média</p>
              <p class="text-lg font-bold">
                {{ formatDuration(callsTotals.avg_seconds_duration) }}
              </p>
            </div>
          </div>

          <!-- Filtros inline -->
          <div class="flex flex-wrap gap-2">
            <input
              v-model="callsFilterStatus"
              placeholder="Filtrar por status..."
              class="border rounded px-3 py-1.5 text-sm w-52 bg-background"
              @keyup.enter="loadCalls(1)"
            />
            <input
              v-model="callsFilterPhone"
              placeholder="Filtrar por número..."
              class="border rounded px-3 py-1.5 text-sm w-48 bg-background"
              @keyup.enter="loadCalls(1)"
            />
            <Button size="sm" @click="loadCalls(1)" :disabled="loadingCalls">
              <Search class="w-4 h-4 mr-1" /> Filtrar
            </Button>
            <Button
              size="sm"
              variant="outline"
              @click="clearCallsFilter"
              :disabled="loadingCalls"
            >
              Limpar
            </Button>
          </div>

          <!-- Tabela de calls -->
          <div class="relative overflow-x-auto">
            <div
              v-if="loadingCalls"
              class="absolute inset-0 flex items-center justify-center bg-background/70 z-10 rounded"
            >
              <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="whitespace-nowrap">Cliente</TableHead>
                  <TableHead class="whitespace-nowrap">Número</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      class="h-fit p-0 text-xs"
                      @click="toggleCallsSort('status')"
                    >
                      Status <CaretSortIcon class="ml-1" />
                    </Button>
                  </TableHead>
                  <TableHead class="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      class="h-fit p-0 text-xs"
                      @click="toggleCallsSort('percentage_heard')"
                    >
                      % Ouvido <CaretSortIcon class="ml-1" />
                    </Button>
                  </TableHead>
                  <TableHead class="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      class="h-fit p-0 text-xs"
                      @click="toggleCallsSort('seconds_duration')"
                    >
                      Duração <CaretSortIcon class="ml-1" />
                    </Button>
                  </TableHead>
                  <TableHead class="text-center whitespace-nowrap">Tentativa</TableHead>
                  <TableHead class="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      class="h-fit p-0 text-xs"
                      @click="toggleCallsSort('tried_at')"
                    >
                      Data/Hora <CaretSortIcon class="ml-1" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="calls.length === 0 && !loadingCalls">
                  <TableRow>
                    <TableCell
                      colspan="7"
                      class="text-center text-muted-foreground py-8"
                    >
                      Nenhuma ligação encontrada.
                    </TableCell>
                  </TableRow>
                </template>
                <TableRow v-for="call in calls" :key="call.call_id">
                  <TableCell class="whitespace-nowrap">{{ call.client_name || "—" }}</TableCell>
                  <TableCell class="whitespace-nowrap">{{ call.phone_number }}</TableCell>
                  <TableCell>
                    <span
                      :class="statusClass(call.status)"
                      class="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    >
                      {{ call.status }}
                    </span>
                  </TableCell>
                  <TableCell class="text-right whitespace-nowrap"
                    >{{ call.percentage_heard.toFixed(2) }}%</TableCell
                  >
                  <TableCell class="text-right whitespace-nowrap">{{
                    formatDuration(call.seconds_duration)
                  }}</TableCell>
                  <TableCell class="text-center whitespace-nowrap"
                    >{{ call.actual_attempt }}/{{
                      call.configured_attempts
                    }}</TableCell
                  >
                  <TableCell class="text-right text-xs whitespace-nowrap">
                    {{
                      call.tried_at
                        ? $moment(call.tried_at).format("DD/MM/YYYY HH:mm:ss")
                        : "—"
                    }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Paginação do modal -->
          <div class="pt-2">
            <CustomPagination
              :pages="{
                current: callsPages.current,
                last: callsPages.last,
                total: callsPages.total,
              }"
              :select-page="loadCalls"
              :per_pages="callsPerPage"
              @update:perPages="
                (val) => {
                  callsPerPage = val;
                  loadCalls(1);
                }
              "
            />
          </div>
        </div>

        <DialogFooter class="p-6 pt-2">
          <Button variant="outline" @click="showCallsModal = false"
            >Fechar</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, h, watch, computed } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast/use-toast";
import { createColumnHelper } from "@tanstack/vue-table";
import { CaretSortIcon } from "@radix-icons/vue";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  Phone,
  PhoneCall,
  PhoneMissed,
  Download,
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Search,
  Loader2,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import Call4u from "@/services/call4u.js";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import PeriodComponent from "@/components/google_analytics/PeriodComponent.vue";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";

// ── Stores & utils ─────────────────────────────────────────────────────────────
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

// ── Date range ─────────────────────────────────────────────────────────────────
const currentDate = today(getLocalTimeZone()).subtract({ days: 0 });
const startDate = currentDate.subtract({ days: 28 });
const selectedRange = ref({ start: startDate, end: currentDate });

// ── Page state ─────────────────────────────────────────────────────────────────
const loading = ref(true);
const last = ref<any>({});
const recharges = ref<any[]>([]);
const callsChart = ref<{ name: string; value: any[] }[]>([]);

// Campaigns table
const campaigns = ref<any[]>([]);
const totalCampaigns = ref();
const campaignPages = ref({ current: 1, total: 0, last: 0 });
const campaignPerPage = ref(10);
const campaignOrderId = ref<string>();
const campaignOrder = ref(false);
const localCampaignSearch = ref<Record<string, string>>({});
const searchCampaignValues = ref<Record<string, string>>({});

// Calls modal
const showCallsModal = ref(false);
const selectedCampaign = ref<any>(null);
const calls = ref<any[]>([]);
const callsTotals = ref<any>(null);
const loadingCalls = ref(false);
const callsPages = ref({ current: 1, total: 0, last: 0 });
const callsPerPage = ref(50);
const callsOrderBy = ref("tried_at");
const callsTypeOrder = ref("desc");
const callsFilterStatus = ref("");
const callsFilterPhone = ref("");

// ── Computed ───────────────────────────────────────────────────────────────────
const rechargesTotal = computed(() =>
  recharges.value.reduce(
    (acc: any, r: any) => {
      acc.credits += Number(r.credits) || 0;
      acc.price += Number(r.price) || 0;
      acc.total += Number(r.total) || 0;
      return acc;
    },
    { credits: 0, price: 0, total: 0 },
  ),
);

const campaignsStats = computed(() => {
  const s = {
    message: "Total",
    total_sent: 0,
    total_answered: 0,
    answer_rate: "0.00",
  };
  campaigns.value.forEach((c: any) => {
    s.total_sent += c.total_sent ?? 0;
    s.total_answered += c.total_answered ?? 0;
  });
  s.answer_rate =
    s.total_sent > 0
      ? ((s.total_answered / s.total_sent) * 100).toFixed(2)
      : "0.00";
  return s;
});

// ── Formatters ─────────────────────────────────────────────────────────────────
const formatNumber = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(v ?? 0);

const formatDuration = (seconds: number) => {
  const s = Math.round(seconds ?? 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
};

const formatPercentage = (v: any) => `${parseFloat(v ?? 0).toFixed(2)}%`;

const statusClass = (status: string) => {
  const s = (status ?? "").toLowerCase();
  if (s.includes("atendida e ouviu")) return "bg-green-100 text-green-700";
  if (s.includes("atendida")) return "bg-blue-100 text-blue-700";
  if (s.includes("não atendida") || s.includes("recusada"))
    return "bg-red-100 text-red-600";
  if (s.includes("desconectada")) return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
};

const formatters = {
  total_sent: formatNumber,
  total_answered: formatNumber,
  answered_with_typing: formatNumber,
  answered_and_listened_to_the_end: formatNumber,
};

const redirectToInvoiceUrl = (url: string) => window.open(url, "_blank");

// ── Main data load ─────────────────────────────────────────────────────────────
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
    const params = {
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
    };

    const { data } = await Call4u.index(params);

    last.value = data.last ?? {};
    recharges.value = data.recharges ?? [];

    callsChart.value = [
      { name: "Total Ligações Enviadas", value: data.daily?.calls ?? [] },
    ];

    if (data.campaigns) {
      campaigns.value = data.campaigns.data.map((c: any) => ({
        ...c,
        answer_rate:
          c.total_sent > 0
            ? ((c.total_answered / c.total_sent) * 100).toFixed(2)
            : "0.00",
      }));
      totalCampaigns.value = data.campaigns.total;
      campaignPages.value = {
        current: data.campaigns.pagination.current_page,
        total: data.campaigns.pagination.total,
        last: data.campaigns.pagination.last_page,
      };
    }
  } catch {
    toast({
      title: "Erro ao carregar dados",
      description: "Não foi possível carregar os dados.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

// ── Campaigns helpers ──────────────────────────────────────────────────────────
const setSearchCampaigns = (values: Record<string, string>) => {
  localCampaignSearch.value = values;
};

const applyCampaignFilter = async (page = campaignPages.value.current) => {
  searchCampaignValues.value = { ...localCampaignSearch.value };
  campaignPages.value.current = page;
  await loadData();
};

// ── Calls modal ────────────────────────────────────────────────────────────────
const openCallsModal = async (campaign: any) => {
  selectedCampaign.value = campaign;
  callsPages.value = { current: 1, total: 0, last: 0 };
  callsFilterStatus.value = "";
  callsFilterPhone.value = "";
  callsOrderBy.value = "tried_at";
  callsTypeOrder.value = "desc";
  showCallsModal.value = true;
  await loadCalls(1);
};

const loadCalls = async (page = callsPages.value.current) => {
  if (!selectedCampaign.value) return;
  loadingCalls.value = true;

  try {
    const params = {
      filter_id: workspaceStore.activeGroupProject?.id,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      page,
      per_page: callsPerPage.value,
      order_by: callsOrderBy.value,
      type_order: callsTypeOrder.value,
      ...(callsFilterStatus.value ? { status: callsFilterStatus.value } : {}),
      ...(callsFilterPhone.value
        ? { phone_number: callsFilterPhone.value }
        : {}),
    };

    const { data } = await Call4u.calls(selectedCampaign.value.id, params);
    calls.value = data.data ?? [];
    callsTotals.value = data.totals ?? null;
    callsPages.value = {
      current: data.pagination.current_page,
      total: data.pagination.total,
      last: data.pagination.last_page,
    };
  } catch {
    toast({
      title: "Erro",
      description: "Não foi possível carregar as ligações.",
      variant: "destructive",
    });
  }

  loadingCalls.value = false;
};

const toggleCallsSort = async (field: string) => {
  if (callsOrderBy.value === field) {
    callsTypeOrder.value = callsTypeOrder.value === "asc" ? "desc" : "asc";
  } else {
    callsOrderBy.value = field;
    callsTypeOrder.value = "desc";
  }
  await loadCalls(1);
};

const clearCallsFilter = async () => {
  callsFilterStatus.value = "";
  callsFilterPhone.value = "";
  await loadCalls(1);
};

// ── Campaign table columns ─────────────────────────────────────────────────────
const columnHelper = createColumnHelper<any>();

function createSortButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: campaignOrderId.value === columnKey ? "default" : "ghost",
      onClick: async () => {
        campaignOrderId.value = columnKey;
        campaignOrder.value = !campaignOrder.value;
        campaignPages.value.current = 1;
        await loadData();
      },
      class: "h-fit text-pretty my-1 w-full justify-end",
    },
    () => [
      h("div", { class: "flex items-center justify-end w-full" }, [
        label,
        h(
          campaignOrderId.value === columnKey
            ? campaignOrder.value
              ? ArrowDown
              : ArrowUp
            : CaretSortIcon,
          { class: "ml-2" },
        ),
      ]),
    ],
  );
}

const campaignColumns = computed(() => [
  columnHelper.accessor("name", {
    header: () => "Nome da Campanha",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("status", {
    header: () => "Status",
    cell: ({ row }) => {
      const s = (row.getValue("status") as string) ?? "";
      return h(
        "span",
        {
          class:
            s === "running"
              ? "text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium"
              : "text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium",
        },
        s === "running" ? "Ativa" : s || "—",
      );
    },
  }),
  columnHelper.accessor("total_sent", {
    header: () => createSortButton("Total Enviado", "total_sent"),
    footer: "sum",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("total_sent") || 0),
      ),
  }),
  columnHelper.accessor("total_answered", {
    header: () => createSortButton("Atendidas", "total_answered"),
    footer: "sum",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("total_answered") || 0),
      ),
  }),
  columnHelper.accessor("answered_with_typing", {
    header: () => createSortButton("Com Digitação", "answered_with_typing"),
    footer: "sum",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("answered_with_typing") || 0),
      ),
  }),
  columnHelper.accessor("answered_and_listened_to_the_end", {
    header: () =>
      createSortButton(
        "Ouviram até o Final",
        "answered_and_listened_to_the_end",
      ),
    footer: "sum",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatNumber(row.getValue("answered_and_listened_to_the_end") || 0),
      ),
  }),
  columnHelper.accessor("answer_rate", {
    header: () => createSortButton("Taxa Atendimento", "answer_rate"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatPercentage(row.getValue("answer_rate")),
      ),
  }),
  columnHelper.accessor("avg_answered_duration_seconds", {
    header: () =>
      createSortButton("Duração Média", "avg_answered_duration_seconds"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-right" },
        formatDuration(row.getValue("avg_answered_duration_seconds")),
      ),
  }),
  columnHelper.accessor("id", {
    header: () => "Ações",
    cell: ({ row }) => {
      const campaign = row.original;
      return h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(Button, { size: "icon", variant: "ghost" }, [
            h(MoreHorizontal, { class: "h-4 w-4" }),
            h("span", { class: "sr-only" }, "Ações"),
          ]),
        ),
        h(DropdownMenuContent, { align: "end" }, [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),
          h(
            DropdownMenuItem,
            { onClick: () => openCallsModal(campaign) },
            "Ver Ligações",
          ),
        ]),
      ]);
    },
  }),
]);

// ── Watchers ───────────────────────────────────────────────────────────────────
watch(campaignPerPage, () => {
  campaignPages.value.current = 1;
  loadData();
});

watch(selectedRange, () => {
  campaignPages.value.current = 1;
  loadData();
});

loadData();
</script>
