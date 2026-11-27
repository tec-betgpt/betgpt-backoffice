<template>
  <div class="w-full space-y-4 p-6 pb-16 max-[450px]:p-2">
    <div class="relative overflow-hidden rounded-xl border bg-card px-5 py-4 shadow-sm">
      <Megaphone class="pointer-events-none absolute -right-2 -top-2 size-24 opacity-[0.04]" />
      <div class="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-3">
          <div class="flex items-center gap-1">
            <h2 class="break-words text-2xl font-bold tracking-tight">{{ campaign?.name || "Campanha" }}</h2>
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground"
              :disabled="!campaignId"
              :aria-label="campaignStatus === 'draft' ? 'Editar campanha' : 'Abrir configuração da campanha'"
              :title="campaignStatus === 'draft' ? 'Editar campanha' : 'Abrir configuração da campanha'"
              @click="openConfiguration"
            >
              <Settings2 class="size-4" />
            </Button>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span v-if="campaign" :class="chipClass">
              <CalendarDays class="size-3.5 text-blue-500" />
              {{ formatDateTime(campaign.schedule?.starts_at || campaign.created_at) }}
            </span>
            <span
              v-if="campaignStatus"
              class="inline-flex h-7 items-center gap-1.5 rounded-full border px-3 font-medium"
              :class="CAMPAIGN_STATUS_BADGE_CLASSES[campaignStatus]"
            >
              <span class="size-1.5 rounded-full bg-current" />
              {{ CAMPAIGN_STATUS_LABELS[campaignStatus] }}
            </span>
            <span v-if="campaign" :class="chipClass">
              <component :is="campaign.type === 'flow' ? GitFork : Send" class="size-3.5 text-blue-500" />
              {{ CAMPAIGN_TYPE_LABELS[campaign.type] }}
            </span>
            <span v-if="campaign" :class="chipClass" :title="segmentLabel">
              <PieChart class="size-3.5 text-muted-foreground" />
              <span class="max-w-[260px] truncate">{{ segmentLabel }}</span>
            </span>
            <CampaignTemplatesPopover :templates="campaignTemplates" />
            <span class="inline-flex h-7 items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 font-medium text-blue-500">
              <Activity class="size-3.5" />
              Progresso: {{ campaignProgress.toFixed(1) }}%
            </span>
            <span
              v-if="financialStatus"
              class="inline-flex h-7 items-center gap-1.5 rounded-full border border-emerald-500/40 px-3 font-medium text-emerald-600 dark:text-emerald-400"
            >
              <Wallet class="size-3.5" />
              Financeiro: {{ FINANCIAL_STATUS_LABELS[financialStatus] }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="campaignStatus === 'running' || campaignStatus === 'prepared'"
            size="sm"
            variant="secondary"
            :disabled="isActing"
            @click="doAction('pause')"
          >Pausar</Button>
          <Button v-if="campaignStatus === 'paused'" size="sm" :disabled="isActing" @click="doAction('resume')">Retomar</Button>
          <Button v-if="canCancel" size="sm" variant="ghost" class="text-destructive hover:text-destructive" :disabled="isActing" @click="isCancelDialogOpen = true">
            Cancelar campanha
          </Button>
          <Button
            size="sm"
            variant="outline"
            :disabled="!campaignId"
            @click="router.push({ name: router.hasRoute('workspace.financial.resource-usage') ? 'workspace.financial.resource-usage' : 'financial.resource-usage', query: { campaign_id: campaignId } })"
          >Uso de recursos</Button>
          <Button size="icon" variant="outline" class="size-8" title="Atualizar" aria-label="Atualizar" :disabled="isLoading" @click="refreshAll">
            <RefreshCw class="size-4" :class="isLoading ? 'animate-spin' : ''" />
          </Button>
        </div>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div
        v-for="metric in summaryMetrics"
        :key="metric.label"
        class="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-card to-muted/5 px-4 py-3 shadow-sm"
      >
        <component :is="metric.icon" class="pointer-events-none absolute -right-2 -top-2 size-16 opacity-[0.05] transition-opacity group-hover:opacity-10" />
        <div class="relative flex items-center gap-1.5 text-sm text-muted-foreground">
          <component :is="metric.icon" class="size-4" :class="metric.iconClass" />
          {{ metric.label }}
        </div>
        <div class="relative mt-1 text-2xl font-bold tabular-nums">{{ formatCount(metric.value) }}</div>
      </div>
    </div>

    <CampaignConversionsPanel v-if="campaignId" ref="conversionsPanel" :campaign-id="campaignId" />

    <Tabs v-model="activeTab" class="space-y-4">
      <TabsList class="grid h-auto w-full auto-cols-fr grid-flow-col overflow-x-auto">
        <TabsTrigger v-for="tab in detailTabs" :key="tab.key" :value="tab.key">
          <component :is="tab.icon" class="mr-1.5 inline size-3.5 align-[-2px]" />{{ tab.title }}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="space-y-4">
        <FlowSummaryPanel v-if="campaign?.type === 'flow'" :definition="campaign.flow_config?.definition || null" />
        <CampaignMonitorOverview v-if="monitor" :channels="monitor.channels" :totals="monitor.channel_totals" />
        <div v-else class="rounded-lg border p-6 text-sm text-muted-foreground">Carregando métricas por canal...</div>
      </TabsContent>

      <TabsContent value="history">
        <CampaignMonitorHistory :items="monitor?.history || []" />
      </TabsContent>

      <TabsContent value="sends" class="space-y-4">
        <CampaignRunProgressPanel v-if="executionStore.run" :run="executionStore.run" />
        <CampaignWavesBatchesPanel
          :campaign-id="campaignId"
          :waves="executionStore.waves"
          :loading="executionStore.loading.refresh"
          :on-refresh-batches="refreshBatches"
        />
        <CampaignRecipientsPanel :campaign-id="campaignId" :active="activeTab === 'sends'" />

        <Card>
          <CardHeader>
            <CardTitle>Ocorrências de disparo</CardTitle>
            <CardDescription>Cada ocorrência representa uma execução única ou recorrente da campanha.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="mb-2 flex justify-end">
              <ColumnVisibilityToggle v-model="dispatchesColumnVisibility" :columns="dispatchesColumns" />
            </div>
            <div class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead v-if="dispatchesColumnVisibility.occurrence !== false">Ocorrência</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.status !== false">Status</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.scheduledFor !== false">Agendado para</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.recipients !== false" class="text-right">Destinatários</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.sent !== false" class="text-right">Enviadas</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.delivered !== false" class="text-right">Entregues</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.failed !== false" class="text-right">Falhas</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.progress !== false">Progresso</TableHead>
                    <TableHead v-if="dispatchesColumnVisibility.broadcasts !== false">Broadcasts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="isLoading && dispatches.length === 0">
                    <TableCell :colspan="visibleDispatchesColumns.length" class="py-8 text-center text-muted-foreground">Carregando disparos...</TableCell>
                  </TableRow>
                  <TableRow v-else-if="dispatches.length === 0">
                    <TableCell :colspan="visibleDispatchesColumns.length" class="py-8 text-center text-muted-foreground">Nenhum disparo criado ainda.</TableCell>
                  </TableRow>
                  <TableRow v-for="dispatch in dispatches" :key="dispatch.id">
                    <TableCell v-if="dispatchesColumnVisibility.occurrence !== false">
                      <div class="font-medium">{{ dispatch.occurrence_key }}</div>
                      <div class="text-xs text-muted-foreground">#{{ dispatch.id }}</div>
                    </TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.status !== false">
                      <Badge :variant="dispatchStatusVariant(dispatch.status)">{{ CAMPAIGN_DISPATCH_STATUS_LABELS[dispatch.status] }}</Badge>
                      <div v-if="dispatch.error" class="mt-1 max-w-[240px] text-xs text-destructive">{{ dispatch.error }}</div>
                    </TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.scheduledFor !== false">{{ formatDateTime(dispatch.scheduled_for) }}</TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.recipients !== false" class="text-right">{{ dispatch.total_recipients }}</TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.sent !== false" class="text-right">{{ dispatch.sent_count }}</TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.delivered !== false" class="text-right">{{ dispatch.delivered_count }}</TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.failed !== false" class="text-right">{{ dispatch.failed_count }}</TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.progress !== false" class="min-w-[140px]">
                      <Progress :model-value="dispatchProgress(dispatch)" />
                      <div class="mt-1 text-xs text-muted-foreground">{{ dispatchProgress(dispatch).toFixed(0) }}%</div>
                    </TableCell>
                    <TableCell v-if="dispatchesColumnVisibility.broadcasts !== false">
                      <div v-if="dispatch.provider_broadcasts?.length" class="space-y-1">
                        <div v-for="broadcast in dispatch.provider_broadcasts" :key="broadcast.id" class="text-xs">
                          <span class="font-mono">{{ shortId(broadcast.external_broadcast_id) }}</span>
                          <Badge variant="outline" class="ml-1">{{ broadcast.status || "—" }}</Badge>
                          <span v-if="broadcast.metrics" class="ml-1 text-muted-foreground">
                            {{ broadcast.metrics.sent ?? 0 }}/{{ broadcast.metrics.total ?? 0 }}
                          </span>
                        </div>
                      </div>
                      <span v-else class="text-xs text-muted-foreground">—</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent v-for="tab in eventTabs" :key="tab.key" :value="tab.key">
        <CampaignMonitorEvents
          :campaign-id="campaignId"
          :project-id="campaign?.project_id || null"
          :type="tab.key"
          :title="tab.title"
          :active="activeTab === tab.key"
          :refresh-key="eventsRefreshKey"
        />
      </TabsContent>

      <TabsContent value="costs">
        <CampaignCostsPanel ref="costsPanel" :campaign-id="campaignId" @financial-status="financialStatus = $event" />
      </TabsContent>

      <TabsContent value="errors">
        <CampaignMonitorErrors :items="monitor?.errors || []" />
      </TabsContent>
    </Tabs>

    <AlertDialog :open="isCancelDialogOpen" @update:open="isCancelDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar campanha</AlertDialogTitle>
          <AlertDialogDescription>
            O cancelamento interrompe os disparos pendentes e solicita o cancelamento das mensagens em andamento nos provedores.
            Mensagens já enfileiradas ainda podem ser entregues. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction :disabled="isActing" @click="confirmCancel">
            {{ isActing ? "Cancelando..." : "Confirmar cancelamento" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Activity,
  CalendarDays,
  CircleAlert,
  Eye,
  GitFork,
  History,
  MailOpen,
  Megaphone,
  MousePointerClick,
  PieChart,
  RefreshCw,
  Send,
  Settings2,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-vue-next";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "vue-sonner";
import {
  CAMPAIGN_DISPATCH_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type CampaignDetail,
  type CampaignDispatch,
  type CampaignDispatchStatus,
  type CampaignStatus,
} from "@/contracts/campaigns";
import type { CampaignMonitorEventType, CampaignMonitorResponse } from "@/contracts/campaignMonitor";
import { FINANCIAL_STATUS_LABELS, type FinancialStatus } from "@/contracts/financialLedger";
import CampaignConversionsPanel from "@/components/campaigns/CampaignConversionsPanel.vue";
import CampaignCostsPanel from "@/components/campaigns/CampaignCostsPanel.vue";
import CampaignRecipientsPanel from "@/components/campaigns/CampaignRecipientsPanel.vue";
import CampaignRunProgressPanel from "@/components/campaigns/CampaignRunProgressPanel.vue";
import CampaignWavesBatchesPanel from "@/components/campaigns/CampaignWavesBatchesPanel.vue";
import CampaignMonitorErrors from "@/components/campaigns/monitor/CampaignMonitorErrors.vue";
import CampaignMonitorEvents from "@/components/campaigns/monitor/CampaignMonitorEvents.vue";
import CampaignMonitorHistory from "@/components/campaigns/monitor/CampaignMonitorHistory.vue";
import CampaignTemplatesPopover from "@/components/campaigns/CampaignTemplatesPopover.vue";
import CampaignMonitorOverview from "@/components/campaigns/monitor/CampaignMonitorOverview.vue";
import { monitorLeads, monitorProgress } from "@/components/campaigns/monitor/campaignMonitorView";
import FlowSummaryPanel from "@/components/campaign-flow/FlowSummaryPanel.vue";
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";
import {
  cancelCampaign,
  getCampaign,
  getCampaignDispatches,
  pauseCampaign,
  resumeCampaign,
} from "@/services/campaigns";
import { getCampaignMonitor } from "@/services/campaignMonitor";
import { useCampaignExecutionStore } from "@/stores/campaignExecution";
import { CAMPAIGN_STATUS_BADGE_CLASSES } from "@/components/campaigns/campaignPresentation";

const route = useRoute();
const router = useRouter();
const executionStore = useCampaignExecutionStore();
const campaign = ref<CampaignDetail | null>(null);
const campaignStatus = ref<CampaignStatus | null>(null);
const dispatches = ref<CampaignDispatch[]>([]);
const monitor = ref<CampaignMonitorResponse | null>(null);
const activeTab = ref("overview");
const isLoading = ref(false);
const isActing = ref(false);
const isCancelDialogOpen = ref(false);
const errorMessage = ref("");
const financialStatus = ref<FinancialStatus | null>(null);
const eventsRefreshKey = ref(0);
const eventTabs: Array<{ key: CampaignMonitorEventType; title: string }> = [
  { key: "opens", title: "Aberturas" },
  { key: "clicks", title: "Cliques" },
  { key: "conversions", title: "Conversões" },
  { key: "bounces", title: "Bounces" },
];
const detailTabs = [
  { key: "overview", title: "Visão Geral", icon: Eye },
  { key: "history", title: "Histórico", icon: History },
  { key: "sends", title: "Envios", icon: Send },
  { key: "opens", title: "Aberturas", icon: MailOpen },
  { key: "clicks", title: "Cliques", icon: MousePointerClick },
  { key: "conversions", title: "Conversões", icon: TrendingUp },
  { key: "bounces", title: "Bounces", icon: CircleAlert },
  { key: "errors", title: "Erros", icon: TriangleAlert },
  { key: "costs", title: "Custos", icon: Wallet },
];
const chipClass = "inline-flex h-7 items-center gap-1.5 rounded-full border bg-muted/30 px-3 font-medium";
const costsPanel = ref<InstanceType<typeof CampaignCostsPanel> | null>(null);
const conversionsPanel = ref<InstanceType<typeof CampaignConversionsPanel> | null>(null);
let pollTimer: number | null = null;

const dispatchesColumns = [
  { id: "occurrence", label: "Ocorrência" },
  { id: "status", label: "Status" },
  { id: "scheduledFor", label: "Agendado para" },
  { id: "recipients", label: "Destinatários" },
  { id: "sent", label: "Enviadas" },
  { id: "delivered", label: "Entregues" },
  { id: "failed", label: "Falhas" },
  { id: "progress", label: "Progresso" },
  { id: "broadcasts", label: "Broadcasts" },
];
const dispatchesColumnVisibility = ref<Record<string, boolean>>({});
const visibleDispatchesColumns = computed(() =>
  dispatchesColumns.filter((column) => dispatchesColumnVisibility.value[column.id] !== false),
);

const campaignId = computed(() => {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
});
const canCancel = computed(() =>
  Boolean(campaignStatus.value && ["validated", "prepared", "running", "paused"].includes(campaignStatus.value)),
);
const campaignProgress = computed(() => monitorProgress(monitor.value));
const campaignTemplates = computed(() => campaign.value?.templates || []);
const segmentLabel = computed(() => {
  const segments = campaign.value?.target_audiences || [];
  if (segments.length === 1) return segments[0].name;
  if (segments.length > 1) return `${segments[0].name} +${segments.length - 1}`;

  const audience = campaign.value?.single_stage_config?.target_audience as any;
  if (audience?.name) return audience.name;
  if (campaign.value?.single_stage_config?.target_audience_id) {
    return `#${campaign.value.single_stage_config.target_audience_id}`;
  }
  return campaign.value?.type === "flow" ? "Entrada do fluxo" : "Todos os leads";
});
const summaryMetrics = computed(() => {
  const fallback = dispatches.value.reduce(
    (acc, dispatch) => {
      acc.leads += dispatch.total_recipients;
      acc.sends += dispatch.sent_count;
      return acc;
    },
    { leads: 0, sends: 0 },
  );
  const totals = monitor.value?.channel_totals;
  return [
    { label: "Envios", value: totals?.sends ?? fallback.sends, icon: Send, iconClass: "text-blue-500" },
    { label: "Cliques", value: totals?.clicks ?? 0, icon: MousePointerClick, iconClass: "text-emerald-500" },
    { label: "Conversões", value: totals?.conversions ?? 0, icon: TrendingUp, iconClass: "text-violet-500" },
    { label: "Leads", value: monitorLeads(monitor.value) || fallback.leads, icon: Users, iconClass: "text-amber-500" },
  ];
});

onMounted(async () => {
  await refresh();
  pollTimer = window.setInterval(() => {
    if (shouldPoll()) refresh(false);
  }, 15000);
});

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer);
});

function shouldPoll() {
  return Boolean(campaignStatus.value && ["validated", "prepared", "running"].includes(campaignStatus.value));
}

async function refresh(showLoading = true) {
  if (!campaignId.value) return;
  if (showLoading) isLoading.value = true;
  errorMessage.value = "";

  try {
    const detail = await getCampaign(campaignId.value);
    campaign.value = detail;
    const [dispatchesResponse, monitorResponse] = await Promise.all([
      getCampaignDispatches(campaignId.value),
      getCampaignMonitor(campaignId.value, detail.project_id),
      detail.status === "draft" ? null : executionStore.fetchRun(campaignId.value),
    ]);
    campaignStatus.value = dispatchesResponse.status;
    dispatches.value = dispatchesResponse.dispatches;
    monitor.value = monitorResponse;
    eventsRefreshKey.value++;
    costsPanel.value?.refresh();
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar o monitor da campanha.");
  } finally {
    isLoading.value = false;
  }
}

function refreshAll() {
  refresh();
  conversionsPanel.value?.refresh();
}

async function refreshBatches() {
  if (campaignId.value) await executionStore.fetchRunBatches(campaignId.value);
}

async function doAction(action: "pause" | "resume") {
  if (!campaignId.value) return;
  isActing.value = true;
  errorMessage.value = "";
  try {
    if (action === "pause") {
      await pauseCampaign(campaignId.value);
      toast("Campanha pausada.");
    } else {
      await resumeCampaign(campaignId.value);
      toast("Campanha retomada.");
    }
    await refresh();
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível executar a ação.");
  } finally {
    isActing.value = false;
  }
}

async function confirmCancel() {
  if (!campaignId.value) return;
  isActing.value = true;
  errorMessage.value = "";
  try {
    await cancelCampaign(campaignId.value);
    toast("Campanha cancelada.");
    isCancelDialogOpen.value = false;
    await refresh();
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível cancelar a campanha.");
  } finally {
    isActing.value = false;
  }
}

function openConfiguration() {
  if (!campaignId.value) return;
  router.push({ name: "campaign-drafts.edit", params: { id: campaignId.value } });
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function dispatchProgress(dispatch: CampaignDispatch) {
  if (!dispatch.total_recipients) return 0;
  const processed = dispatch.sent_count + dispatch.failed_count + dispatch.skipped_count;
  return Math.min(processed / dispatch.total_recipients * 100, 100);
}

function dispatchStatusVariant(status: CampaignDispatchStatus) {
  if (status === "failed" || status === "cancelled") return "destructive";
  if (status === "completed_with_errors") return "secondary";
  if (status === "completed") return "default";
  return "outline";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}…` : value;
}

function getHttpMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
</script>
