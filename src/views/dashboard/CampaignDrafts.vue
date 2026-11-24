<template>
  <div class="w-full space-y-5 p-10 pb-16 max-[450px]:p-2">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="space-y-0.5">
        <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Megaphone class="size-6" />
          Campanhas
        </h2>
        <p class="text-sm text-muted-foreground">Acompanhe os resultados do projeto e abra cada campanha para ver os detalhes.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" title="Atualizar" aria-label="Atualizar" :disabled="isLoading" @click="refreshAll">
          <RefreshCw class="size-4" :class="isLoading || isSummaryLoading ? 'animate-spin' : ''" />
        </Button>
        <Button @click="router.push({ name: 'campaign-drafts.create' })">
          <Plus class="size-4" />
          Criar nova campanha
        </Button>
      </div>
    </div>

    <section class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-sm font-semibold">Resumo do projeto</h3>
        <Select v-model="summaryPeriod">
          <SelectTrigger class="h-7 w-auto gap-1.5 rounded-md px-2.5 text-xs">
            <CalendarDays class="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert v-if="summaryError" variant="destructive"><AlertDescription>{{ summaryError }}</AlertDescription></Alert>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="metric in kpiCards"
          :key="metric.key"
          class="group relative overflow-hidden rounded-lg border px-3 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md"
          :class="metric.highlight
            ? 'border-blue-500/40 bg-blue-500/5'
            : 'border-border/50 bg-gradient-to-br from-card to-muted/5 hover:to-muted/20 dark:border-border/30'"
        >
          <div class="pointer-events-none absolute -right-1.5 -top-1.5 size-12 opacity-[0.06] transition-opacity group-hover:opacity-10">
            <component :is="metric.icon" class="size-full" />
          </div>
          <div class="relative space-y-0.5">
            <div class="flex items-center gap-1.5">
              <component :is="metric.icon" class="size-3.5 shrink-0" :class="metric.highlight ? 'text-blue-500' : 'text-muted-foreground'" />
              <span class="truncate text-xs font-medium" :class="metric.highlight ? 'text-blue-500' : 'text-muted-foreground'">{{ metric.label }}</span>
            </div>
            <div class="flex flex-wrap items-baseline gap-x-1.5">
              <span class="text-lg font-bold tabular-nums" :class="metric.highlight ? 'text-blue-500' : 'text-foreground'">
                <template v-if="summary">{{ metric.display }}</template>
                <span v-else class="inline-block h-5 w-12 animate-pulse rounded bg-muted align-middle" />
              </span>
              <span v-if="summary && metric.rate" class="text-[11px] tabular-nums text-muted-foreground">{{ metric.rate }}</span>
              <span
                v-if="summary && metric.delta"
                class="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                :class="metric.delta.positive ? 'text-emerald-500' : 'text-destructive'"
              >
                <component :is="metric.delta.positive ? TrendingUp : TrendingDown" class="size-3" />
                {{ metric.delta.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="space-y-4">
      <nav class="flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b" aria-label="Status das campanhas">
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          type="button"
          class="relative flex items-center gap-1.5 whitespace-nowrap px-3 pb-2 pt-1 text-sm transition-colors"
          :class="activeStatusTab === tab.key
            ? 'font-medium text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
            : 'text-muted-foreground hover:text-foreground'"
          @click="applyStatusTab(tab.key)"
        >
          {{ tab.label }}
          <span
            v-if="tab.key !== 'all' && statusCount(tab.key) > 0"
            class="rounded-full border px-1.5 text-[10px] leading-4 tabular-nums"
            :class="tabCountClass(tab.key)"
          >{{ statusCount(tab.key) }}</span>
        </button>
      </nav>

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div class="grid w-full items-center gap-1.5 sm:w-[240px] sm:max-w-sm">
          <Input
            :model-value="filters.search ?? ''"
            placeholder="Buscar por nome ou descrição..."
            @update:modelValue="filters.search = $event === '' ? null : String($event)"
            @keydown.enter="fetchCampaigns(1)"
          />
        </div>
        <Button class="w-full shrink-0 sm:w-auto" :disabled="isLoading" @click="fetchCampaigns(1)">Buscar</Button>
        <div class="flex min-w-0 flex-1 gap-2" />
        <div class="flex items-center gap-2">
          <Label>Canal</Label>
          <Select v-model="filters.channel">
            <SelectTrigger class="w-[180px]"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
              <SelectItem v-for="option in CAMPAIGN_CHANNEL_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-center gap-2">
          <Label>Tipo</Label>
          <Select v-model="filters.type">
            <SelectTrigger class="w-[180px]"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
              <SelectItem v-for="option in CAMPAIGN_TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Falha ao carregar campanhas</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div
      v-if="!isLoading && campaigns.length === 0 && !errorMessage"
      class="rounded-lg border border-dashed p-8 text-center"
    >
      <div class="text-base font-medium">Nenhuma campanha encontrada.</div>
      <p class="mt-2 text-sm text-muted-foreground">Ajuste os filtros ou crie uma nova campanha.</p>
      <Button class="mt-4" @click="router.push({ name: 'campaign-drafts.create' })">
        <Plus class="size-4" />
        Criar nova campanha
      </Button>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Carregando campanhas">
      <div v-for="index in 6" :key="index" class="h-36 animate-pulse rounded-lg border bg-muted/40" />
    </div>

    <div v-else-if="campaigns.length" class="space-y-8">
      <section v-for="group in campaignGroups" :key="group.key" :data-test="`campaign-date-group-${group.key}`" class="space-y-2">
        <h3 class="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays class="size-5 text-muted-foreground" />
          {{ group.label }}
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CampaignCard
            v-for="item in group.items"
            :key="item.id"
            :campaign="item"
            :deleting="isDeleting && selectedCampaign?.id === item.id"
            @open="openCampaignDetail"
            @edit="openCampaign"
            @delete="openDeleteDialog"
          />
        </div>
      </section>
    </div>

    <CustomPagination
      v-if="campaigns.length > 0 || isLoading"
      :select-page="fetchCampaigns"
      :pages="pages"
      :per_pages="filters.per_page"
      @update:perPages="updatePerPage"
    />

    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir campanha draft</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação remove a campanha <strong>{{ selectedCampaign?.name }}</strong>. Apenas campanhas em rascunho podem ser excluídas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction :disabled="isDeleting" @click="confirmDelete">
            {{ isDeleting ? "Excluindo..." : "Confirmar exclusão" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CampaignCard from "@/components/campaigns/CampaignCard.vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Megaphone,
  MailOpen,
  MousePointerClick,
  Percent,
  Plus,
  RefreshCw,
  Send,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import {
  CAMPAIGN_CHANNEL_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  type CampaignChannel,
  type CampaignListItem,
  type CampaignListParams,
  type CampaignStatus,
  type CampaignSummaryPeriod,
  type CampaignSummaryResponse,
  type CampaignType,
} from "@/contracts/campaigns";
import { deleteCampaign, getCampaignSummary, listCampaigns } from "@/services/campaigns";
import {
  CAMPAIGN_LIST_TABS,
  campaignTabFilters,
  campaignTabFromFilters,
  groupCampaignsByUpdatedDate,
  type CampaignListTab,
} from "@/components/campaigns/campaignList";
import { formatCampaignNumber, formatCampaignRate } from "@/components/campaigns/campaignPresentation";
import { useWorkspaceStore } from "@/stores/workspace";

const router = useRouter();
const workspaceStore = useWorkspaceStore();
const SELECT_ALL_VALUE = "__all__";

const campaigns = ref<CampaignListItem[]>([]);
const isLoading = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");
const isDeleteDialogOpen = ref(false);
const selectedCampaign = ref<CampaignListItem | null>(null);
const summary = ref<CampaignSummaryResponse | null>(null);
const summaryPeriod = ref<CampaignSummaryPeriod>("30d");
const isSummaryLoading = ref(false);
const summaryError = ref("");
const statusTabs = CAMPAIGN_LIST_TABS;

const filters = reactive<Omit<CampaignListParams, "status" | "channel" | "type"> & { status: CampaignStatus | typeof SELECT_ALL_VALUE | null; channel: CampaignChannel | typeof SELECT_ALL_VALUE | null; type: CampaignType | typeof SELECT_ALL_VALUE | null }>({
  filter_id: null,
  project_id: null,
  status: SELECT_ALL_VALUE,
  channel: SELECT_ALL_VALUE,
  type: SELECT_ALL_VALUE,
  scheduled: null,
  search: "",
  per_page: 10,
  page: 1,
});

const pages = reactive({
  current: 1,
  total: 0,
  last: 1,
});

const activeProjectId = computed(() => {
  const numeric = Number(workspaceStore.activeGroupProject?.project_id);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
});

const activeStatusTab = computed(() => campaignTabFromFilters({
  status: filters.status === SELECT_ALL_VALUE ? null : filters.status,
  type: filters.type === SELECT_ALL_VALUE ? null : filters.type,
  scheduled: filters.scheduled,
}));
const campaignGroups = computed(() => groupCampaignsByUpdatedDate(campaigns.value));
const kpiCards = computed(() => {
  const kpis = summary.value?.kpis;
  const value = (key: keyof CampaignSummaryResponse["kpis"]) => kpis?.[key]?.value ?? 0;
  return [
    { key: "active_campaigns", label: "Campanhas ativas", icon: Megaphone },
    { key: "sends", label: "Envios", icon: Send, compactFrom: 10000 },
    { key: "opens", label: "Aberturas", icon: MailOpen, rate: formatCampaignRate(value("opens"), value("sends")), compactFrom: 10000 },
    { key: "clicks", label: "Cliques", icon: MousePointerClick, rate: formatCampaignRate(value("clicks"), value("opens") || value("sends")), compactFrom: 10000 },
    { key: "conversions", label: "Conversões", icon: Target, compactFrom: 10000 },
    { key: "conversion_rate", label: "Taxa de conversão", icon: Percent, highlight: true },
  ].map((definition) => {
    const key = definition.key as keyof CampaignSummaryResponse["kpis"];
    const metric = kpis?.[key];
    const isRate = key === "conversion_rate";
    return {
      ...definition,
      highlight: Boolean(definition.highlight),
      rate: definition.rate ?? null,
      display: isRate ? formatPercentValue(value(key)) : formatCampaignNumber(value(key), definition.compactFrom ?? Infinity),
      delta: metric ? kpiDelta(metric.value, metric.previous, metric.change_percent, isRate) : null,
    };
  });
});

watch(
  activeProjectId,
  async (projectId) => {
    filters.project_id = projectId;
    await Promise.all([fetchCampaigns(1), fetchSummary()]);
  },
  { immediate: true },
);

watch(summaryPeriod, () => fetchSummary());
watch(() => [filters.channel, filters.type], () => fetchCampaigns(1));

onMounted(async () => {
  if (!activeProjectId.value) {
    await fetchCampaigns(1);
  }
});

async function fetchCampaigns(page = 1) {
  isLoading.value = true;
  errorMessage.value = "";
  filters.page = page;

  try {
    const response = await listCampaigns(sanitizeFilters());
    campaigns.value = response.data;
    pages.current = response.current_page;
    pages.total = response.total;
    pages.last = response.last_page;
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar a listagem de campanhas.");
    campaigns.value = [];
    pages.current = 1;
    pages.total = 0;
    pages.last = 1;
  } finally {
    isLoading.value = false;
  }
}

async function fetchSummary() {
  if (!activeProjectId.value) {
    summary.value = null;
    return;
  }
  isSummaryLoading.value = true;
  summaryError.value = "";
  try {
    summary.value = await getCampaignSummary(activeProjectId.value, summaryPeriod.value);
  } catch (error) {
    summaryError.value = getHttpMessage(error, "Não foi possível carregar os KPIs do projeto.");
  } finally {
    isSummaryLoading.value = false;
  }
}

function refreshAll() {
  fetchCampaigns(pages.current || 1);
  fetchSummary();
}

function tabCountClass(tab: CampaignListTab) {
  if (tab === "running") return "border-emerald-500/50 text-emerald-500";
  if (tab === "paused") return "border-amber-500/50 text-amber-500";
  return "border-border text-muted-foreground";
}

function applyStatusTab(value: unknown) {
  const tab = statusTabs.find((item) => item.key === value)?.key || "all";
  const next = campaignTabFilters(tab);
  filters.status = next.status || SELECT_ALL_VALUE;
  filters.type = next.type || SELECT_ALL_VALUE;
  filters.scheduled = next.scheduled;
  fetchCampaigns(1);
}

function statusCount(tab: CampaignListTab) {
  return summary.value?.status_counts[tab] ?? 0;
}

function sanitizeFilters(): CampaignListParams {
  return {
    project_id: filters.project_id,
    status: filters.status === SELECT_ALL_VALUE ? null : filters.status,
    channel: filters.channel === SELECT_ALL_VALUE ? null : filters.channel,
    type: filters.type === SELECT_ALL_VALUE ? null : filters.type,
    scheduled: filters.scheduled || null,
    search: filters.search?.trim() || null,
    per_page: filters.per_page || 10,
    page: filters.page || 1,
  };
}

function updatePerPage(value: string) {
  filters.per_page = Number(value) || 10;
  fetchCampaigns(1);
}

function openCampaign(item: CampaignListItem) {
  router.push({ name: "campaign-drafts.edit", params: { id: item.id } });
}

function openCampaignDetail(item: CampaignListItem) {
  router.push({ name: "campaign-drafts.show", params: { id: item.id } });
}

function openDeleteDialog(item: CampaignListItem) {
  selectedCampaign.value = item;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!selectedCampaign.value || selectedCampaign.value.status !== "draft") {
    return;
  }

  isDeleting.value = true;
  errorMessage.value = "";

  try {
    await deleteCampaign(selectedCampaign.value.id);
    toast("Campanha draft excluída.");
    isDeleteDialogOpen.value = false;

    const nextPage =
      campaigns.value.length === 1 && pages.current > 1 ? pages.current - 1 : pages.current;
    await Promise.all([fetchCampaigns(nextPage), fetchSummary()]);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível excluir a campanha.");
  } finally {
    isDeleting.value = false;
  }
}

function formatPercentValue(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function kpiDelta(current: number, previous: number | null, changePercent: number | null, isRate: boolean) {
  if (previous === null) return null;
  const formatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  if (isRate) {
    const diff = current - previous;
    if (diff === 0) return null;
    return { positive: diff > 0, label: `${formatter.format(Math.abs(diff))} p.p.` };
  }
  if (changePercent === null || changePercent === 0) return null;
  return { positive: changePercent > 0, label: `${formatter.format(Math.abs(changePercent))}%` };
}

function getHttpMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

</script>
