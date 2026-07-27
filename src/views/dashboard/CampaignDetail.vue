<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-2xl font-bold tracking-tight">{{ campaign?.name || "Campanha" }}</h2>
          <Badge v-if="campaignStatus" :variant="statusVariant(campaignStatus)">
            {{ CAMPAIGN_STATUS_LABELS[campaignStatus] }}
          </Badge>
        </div>
        <p class="text-muted-foreground">
          Acompanhe o progresso do disparo via SMS Funnel: ocorrências, broadcasts e entregas.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" @click="router.push({ name: 'campaign-drafts.index' })">Voltar para lista</Button>
        <Button variant="outline" :disabled="isLoading" @click="refresh">
          {{ isLoading ? "Atualizando..." : "Atualizar" }}
        </Button>
        <Button
          v-if="campaignStatus === 'running' || campaignStatus === 'prepared'"
          variant="secondary"
          :disabled="isActing"
          @click="doAction('pause')"
        >
          Pausar
        </Button>
        <Button
          v-if="campaignStatus === 'paused'"
          :disabled="isActing"
          @click="doAction('resume')"
        >
          Retomar
        </Button>
        <Button
          v-if="canCancel"
          variant="destructive"
          :disabled="isActing"
          @click="isCancelDialogOpen = true"
        >
          Cancelar campanha
        </Button>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card v-for="metric in summaryMetrics" :key="metric.label">
        <CardHeader class="pb-2">
          <CardDescription>{{ metric.label }}</CardDescription>
          <CardTitle class="text-2xl">{{ metric.value }}</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Ocorrências de disparo</CardTitle>
        <CardDescription>
          Cada ocorrência representa uma execução da campanha (disparo único ou recorrência).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ocorrência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agendado para</TableHead>
                <TableHead class="text-right">Destinatários</TableHead>
                <TableHead class="text-right">Enviadas</TableHead>
                <TableHead class="text-right">Entregues</TableHead>
                <TableHead class="text-right">Falhas</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Broadcasts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading && dispatches.length === 0">
                <TableCell colspan="9" class="py-8 text-center text-muted-foreground">
                  Carregando disparos...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="dispatches.length === 0">
                <TableCell colspan="9" class="py-8 text-center text-muted-foreground">
                  Nenhum disparo criado ainda. Dispare a campanha pelo builder.
                </TableCell>
              </TableRow>
              <TableRow v-for="dispatch in dispatches" :key="dispatch.id">
                <TableCell>
                  <div class="font-medium">{{ dispatch.occurrence_key }}</div>
                  <div class="text-xs text-muted-foreground">#{{ dispatch.id }}</div>
                </TableCell>
                <TableCell>
                  <Badge :variant="dispatchStatusVariant(dispatch.status)">
                    {{ CAMPAIGN_DISPATCH_STATUS_LABELS[dispatch.status] }}
                  </Badge>
                  <div v-if="dispatch.error" class="mt-1 max-w-[240px] text-xs text-destructive">
                    {{ dispatch.error }}
                  </div>
                </TableCell>
                <TableCell>{{ formatDateTime(dispatch.scheduled_for) }}</TableCell>
                <TableCell class="text-right">{{ dispatch.total_recipients }}</TableCell>
                <TableCell class="text-right">{{ dispatch.sent_count }}</TableCell>
                <TableCell class="text-right">{{ dispatch.delivered_count }}</TableCell>
                <TableCell class="text-right">{{ dispatch.failed_count }}</TableCell>
                <TableCell class="min-w-[140px]">
                  <Progress :model-value="dispatchProgress(dispatch)" />
                  <div class="mt-1 text-xs text-muted-foreground">{{ dispatchProgress(dispatch).toFixed(0) }}%</div>
                </TableCell>
                <TableCell>
                  <div v-if="dispatch.provider_broadcasts?.length" class="space-y-1">
                    <div
                      v-for="broadcast in dispatch.provider_broadcasts"
                      :key="broadcast.id"
                      class="text-xs"
                    >
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

    <AlertDialog :open="isCancelDialogOpen" @update:open="isCancelDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar campanha</AlertDialogTitle>
          <AlertDialogDescription>
            O cancelamento interrompe os disparos pendentes e tenta cancelar os broadcasts em andamento no SMS Funnel.
            Mensagens já enfileiradas no provedor ainda podem ser entregues. Esta ação não pode ser desfeita.
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  CAMPAIGN_DISPATCH_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  type CampaignDetail,
  type CampaignDispatch,
  type CampaignDispatchStatus,
  type CampaignStatus,
} from "@/contracts/campaigns";
import {
  cancelCampaign,
  getCampaign,
  getCampaignDispatches,
  pauseCampaign,
  resumeCampaign,
} from "@/services/campaigns";

const route = useRoute();
const router = useRouter();

const campaign = ref<CampaignDetail | null>(null);
const campaignStatus = ref<CampaignStatus | null>(null);
const dispatches = ref<CampaignDispatch[]>([]);
const isLoading = ref(false);
const isActing = ref(false);
const isCancelDialogOpen = ref(false);
const errorMessage = ref("");
let pollTimer: number | null = null;

const campaignId = computed(() => {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const canCancel = computed(() =>
  Boolean(campaignStatus.value && ["validated", "prepared", "running", "paused"].includes(campaignStatus.value)),
);

const summaryMetrics = computed(() => {
  const totals = dispatches.value.reduce(
    (acc, dispatch) => {
      acc.recipients += dispatch.total_recipients;
      acc.sent += dispatch.sent_count;
      acc.delivered += dispatch.delivered_count;
      acc.failed += dispatch.failed_count;
      return acc;
    },
    { recipients: 0, sent: 0, delivered: 0, failed: 0 },
  );

  return [
    { label: "Ocorrências", value: String(dispatches.value.length) },
    { label: "Destinatários", value: String(totals.recipients) },
    { label: "Enviadas", value: String(totals.sent) },
    { label: "Entregues", value: String(totals.delivered) },
    { label: "Falhas", value: String(totals.failed) },
  ];
});

onMounted(async () => {
  await refresh();
  pollTimer = window.setInterval(() => {
    if (shouldPoll()) {
      refresh(false);
    }
  }, 15000);
});

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer);
});

function shouldPoll() {
  return Boolean(
    campaignStatus.value && ["validated", "prepared", "running"].includes(campaignStatus.value),
  );
}

async function refresh(showLoading = true) {
  if (!campaignId.value) return;

  if (showLoading) isLoading.value = true;
  errorMessage.value = "";

  try {
    const [detail, dispatchesResponse] = await Promise.all([
      campaign.value ? Promise.resolve(campaign.value) : getCampaign(campaignId.value),
      getCampaignDispatches(campaignId.value),
    ]);

    campaign.value = detail;
    campaignStatus.value = dispatchesResponse.status;
    dispatches.value = dispatchesResponse.dispatches;
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar os disparos da campanha.");
  } finally {
    isLoading.value = false;
  }
}

async function doAction(action: "pause" | "resume") {
  if (!campaignId.value) return;

  isActing.value = true;
  errorMessage.value = "";

  try {
    if (action === "pause") {
      await pauseCampaign(campaignId.value);
      toast({ title: "Campanha pausada." });
    } else {
      await resumeCampaign(campaignId.value);
      toast({ title: "Campanha retomada." });
    }
    campaign.value = null;
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
    toast({ title: "Campanha cancelada." });
    isCancelDialogOpen.value = false;
    campaign.value = null;
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
  return Math.min((processed / dispatch.total_recipients) * 100, 100);
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

function formatDateTime(value: string | null) {
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
