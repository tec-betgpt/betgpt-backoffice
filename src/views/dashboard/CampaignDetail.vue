<template>
  <div class="w-full space-y-6 p-10 pb-16 max-[450px]:p-2">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-2xl font-bold tracking-tight">{{ campaign?.name || "Campanha" }}</h2>
          <Badge v-if="campaignStatus" :variant="statusVariant(campaignStatus)">
            {{ CAMPAIGN_STATUS_LABELS[campaignStatus] }}
          </Badge>
          <Badge v-if="campaign" variant="outline">{{ formatDateTime(campaign.schedule?.starts_at || campaign.created_at) }}</Badge>
          <Badge v-if="campaign" variant="outline">{{ CAMPAIGN_TYPE_LABELS[campaign.type] }}</Badge>
          <Badge v-if="campaign" variant="outline">Segmento: {{ segmentLabel }}</Badge>
          <Badge variant="secondary">{{ campaign?.messages?.length || 0 }} template(s)</Badge>
          <Badge variant="secondary">Progresso: {{ campaignProgress.toFixed(0) }}%</Badge>
          <Badge
            v-if="financialStatus"
            variant="outline"
            class="border-emerald-600/40 text-emerald-600 dark:border-emerald-500/40 dark:text-emerald-400"
          >
            Financeiro: {{ FINANCIAL_STATUS_LABELS[financialStatus] }}
          </Badge>
        </div>
        <p class="text-muted-foreground">Monitore canais, histórico, envios, custos e erros da campanha.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" @click="router.push({ name: 'campaign-drafts.index' })">Voltar para lista</Button>
        <Button
          variant="outline"
          :disabled="!campaignId"
          @click="router.push({ name: 'financial.resource-usage', query: { campaign_id: campaignId } })"
        >Uso de recursos</Button>
        <Button variant="outline" :disabled="isLoading" @click="refreshAll">
          {{ isLoading ? "Atualizando..." : "Atualizar" }}
        </Button>
        <Button
          v-if="campaignStatus === 'running' || campaignStatus === 'prepared'"
          variant="secondary"
          :disabled="isActing"
          @click="doAction('pause')"
        >Pausar</Button>
        <Button v-if="campaignStatus === 'paused'" :disabled="isActing" @click="doAction('resume')">Retomar</Button>
        <Button v-if="canCancel" variant="destructive" :disabled="isActing" @click="isCancelDialogOpen = true">
          Cancelar campanha
        </Button>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card v-for="metric in summaryMetrics" :key="metric.label">
        <CardHeader class="pb-2">
          <CardDescription>{{ metric.label }}</CardDescription>
          <CardTitle class="text-2xl">{{ metric.value }}</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Tabs v-model="activeTab" class="space-y-4">
      <TabsList class="flex w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
        <TabsTrigger value="sends">Envios</TabsTrigger>
        <TabsTrigger value="costs">Custos</TabsTrigger>
        <TabsTrigger value="errors">Erros</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="space-y-4">
        <FlowSummaryPanel v-if="campaign?.type === 'flow'" :definition="campaign.flow_config?.definition || null" />
        <CampaignMonitorOverview v-if="monitor" :channels="monitor.channels" :totals="monitor.channel_totals" />
        <Card v-else><CardContent class="pt-6 text-sm text-muted-foreground">Carregando métricas por canal...</CardContent></Card>
        <CampaignConversionsPanel v-if="campaignId" ref="conversionsPanel" :campaign-id="campaignId" />
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
import type { CampaignMonitorResponse } from "@/contracts/campaignMonitor";
import { FINANCIAL_STATUS_LABELS, type FinancialStatus } from "@/contracts/financialLedger";
import CampaignConversionsPanel from "@/components/campaigns/CampaignConversionsPanel.vue";
import CampaignCostsPanel from "@/components/campaigns/CampaignCostsPanel.vue";
import CampaignRecipientsPanel from "@/components/campaigns/CampaignRecipientsPanel.vue";
import CampaignRunProgressPanel from "@/components/campaigns/CampaignRunProgressPanel.vue";
import CampaignWavesBatchesPanel from "@/components/campaigns/CampaignWavesBatchesPanel.vue";
import CampaignMonitorErrors from "@/components/campaigns/monitor/CampaignMonitorErrors.vue";
import CampaignMonitorHistory from "@/components/campaigns/monitor/CampaignMonitorHistory.vue";
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
const segmentLabel = computed(() => {
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
    { label: "Envios", value: String(totals?.sends ?? fallback.sends) },
    { label: "Cliques", value: String(totals?.clicks ?? 0) },
    { label: "Conversões", value: String(totals?.conversions ?? 0) },
    { label: "Leads", value: String(monitorLeads(monitor.value) || fallback.leads) },
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
      executionStore.fetchRun(campaignId.value),
    ]);
    campaignStatus.value = dispatchesResponse.status;
    dispatches.value = dispatchesResponse.dispatches;
    monitor.value = monitorResponse;
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

function statusVariant(status: CampaignStatus) {
  if (status === "draft" || status === "validated") return "outline";
  if (status === "validation_failed" || status === "canceled" || status === "archived") return "destructive";
  if (status === "validating" || status === "paused") return "secondary";
  return "default";
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
