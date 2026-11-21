<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Campanhas</h2>
        <p class="text-muted-foreground">
          Acompanhe os KPIs do projeto, filtre por status e acesse o monitor de cada campanha.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" :disabled="isLoading" @click="fetchCampaigns(1)">Atualizar</Button>
        <Button @click="router.push({ name: 'campaign-drafts.create' })">Criar nova campanha</Button>
      </div>
    </div>

    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold">Resumo do projeto</h3>
          <p class="text-sm text-muted-foreground">Métricas de campanhas e comparativo com o período anterior.</p>
        </div>
        <Select v-model="summaryPeriod">
          <SelectTrigger class="w-48"><SelectValue /></SelectTrigger>
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
      <div v-if="summary" class="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card v-for="metric in kpiCards" :key="metric.key">
          <CardHeader class="pb-2">
            <CardDescription>{{ metric.label }}</CardDescription>
            <CardTitle class="text-2xl">{{ formatKpiValue(metric.key, metric.value) }}</CardTitle>
          </CardHeader>
          <CardContent><p class="text-xs text-muted-foreground">{{ formatComparison(metric) }}</p></CardContent>
        </Card>
      </div>
      <p v-if="isSummaryLoading" class="text-xs text-muted-foreground">Atualizando métricas...</p>
    </section>

    <Tabs :model-value="activeStatusTab" @update:modelValue="applyStatusTab">
      <TabsList class="flex w-full justify-start overflow-x-auto">
        <TabsTrigger v-for="tab in statusTabs" :key="tab.key" :value="tab.key" class="gap-2">
          {{ tab.label }}
          <Badge variant="secondary">{{ statusCount(tab.key) }}</Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Falha ao carregar campanhas</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section aria-label="Filtros" class="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.6fr)_repeat(3,minmax(160px,1fr))]">
        <div class="space-y-2 md:col-span-2 xl:col-span-1">
          <Label>Busca</Label>
          <Input
            :model-value="filters.search ?? ''"
            placeholder="Buscar por nome ou descrição"
            @update:modelValue="filters.search = $event === '' ? null : String($event)"
            @keydown.enter="fetchCampaigns(1)"
          />
        </div>

        <div class="space-y-2">
          <Label>Status</Label>
          <Select v-model="filters.status">
            <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
              <SelectItem v-for="option in CAMPAIGN_STATUS_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>Canal</Label>
          <Select v-model="filters.channel">
            <SelectTrigger><SelectValue placeholder="Todos os canais" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
              <SelectItem v-for="option in CAMPAIGN_CHANNEL_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>Tipo</Label>
          <Select v-model="filters.type">
            <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
              <SelectItem v-for="option in CAMPAIGN_TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-muted-foreground">Projeto ativo: {{ activeProjectLabel }}</p>
        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" @click="resetFilters">Limpar filtros</Button>
          <Button :disabled="isLoading" @click="fetchCampaigns(1)">Buscar</Button>
        </div>
      </div>
    </section>

    <Card v-if="!isLoading && campaigns.length === 0 && !errorMessage">
      <CardContent class="pt-6">
        <div class="rounded-md border border-dashed p-8 text-center">
          <div class="text-base font-medium">Nenhuma campanha encontrada.</div>
          <p class="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou crie um novo draft para começar o builder.
          </p>
          <Button class="mt-4" @click="router.push({ name: 'campaign-drafts.create' })">Criar nova campanha</Button>
        </div>
      </CardContent>
    </Card>

    <div v-if="isLoading" class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3" aria-label="Carregando campanhas">
      <div v-for="index in 6" :key="index" class="h-72 animate-pulse rounded-xl border bg-muted/40" />
    </div>

    <div v-else-if="campaigns.length" class="space-y-8">
      <section v-for="group in campaignGroups" :key="group.key" :data-test="`campaign-date-group-${group.key}`" class="space-y-4">
        <header class="flex items-center gap-3 border-b pb-2">
          <h3 class="text-sm font-semibold">{{ group.label }}</h3>
          <span class="text-xs text-muted-foreground">{{ group.items.length }} campanha(s)</span>
        </header>
        <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "vue-sonner";
import {
  CAMPAIGN_CHANNEL_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  type CampaignChannel,
  type CampaignKpiComparison,
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

const activeProjectLabel = computed(
  () => workspaceStore.activeGroupProject?.name || "Nenhum projeto ativo selecionado",
);
const activeStatusTab = computed(() => campaignTabFromFilters({
  status: filters.status === SELECT_ALL_VALUE ? null : filters.status,
  type: filters.type === SELECT_ALL_VALUE ? null : filters.type,
  scheduled: filters.scheduled,
}));
const campaignGroups = computed(() => groupCampaignsByUpdatedDate(campaigns.value));
const kpiCards = computed(() => {
  if (!summary.value) return [];
  const definitions = [
    { key: "active_campaigns", label: "Campanhas ativas" },
    { key: "sends", label: "Envios" },
    { key: "opens", label: "Aberturas" },
    { key: "clicks", label: "Cliques" },
    { key: "conversions", label: "Conversões" },
    { key: "conversion_rate", label: "Taxa de conversão" },
  ] as const;
  return definitions.map((definition) => ({
    ...definition,
    ...summary.value!.kpis[definition.key],
  }));
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

function resetFilters() {
  filters.status = SELECT_ALL_VALUE;
  filters.channel = SELECT_ALL_VALUE;
  filters.type = SELECT_ALL_VALUE;
  filters.scheduled = null;
  filters.search = "";
  filters.page = 1;
  fetchCampaigns(1);
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

function formatKpiValue(key: keyof CampaignSummaryResponse["kpis"], value: number) {
  const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
  return key === "conversion_rate" ? `${formatted}%` : formatted;
}

function formatComparison(metric: CampaignKpiComparison) {
  if (metric.previous === null) return "Sem período anterior";
  if (metric.change_percent === null) return "Novo no período";
  const signal = metric.change_percent > 0 ? "+" : "";
  return `${signal}${metric.change_percent}% vs período anterior`;
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
