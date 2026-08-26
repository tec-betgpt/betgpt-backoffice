<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-2xl font-bold tracking-tight">{{ campaignId ? "Editar campanha" : "Nova campanha" }}</h2>
          <Badge v-if="campaign" :variant="statusVariant(campaign.status)">{{ statusLabel }}</Badge>
          <Badge v-if="configurationProgress" :variant="progressVariant(configurationProgress.status)">
            {{ progressStatusLabel(configurationProgress.status) }}
          </Badge>
          <Badge v-if="isDirty" variant="secondary">Alterações locais</Badge>
          <Badge v-else-if="campaign" variant="outline">Sincronizado</Badge>
        </div>
        <p class="text-muted-foreground">
          <template v-if="activeCampaignTab === 'execution'">
            Acompanhe o estado operacional da execução (run materializado) da campanha.
          </template>
          <template v-else>
            Configure, estime e valide a campanha SMS usando o estado calculado pelo backend.
          </template>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" @click="router.push({ name: 'campaign-drafts.index' })">Voltar para lista</Button>
        <template v-if="activeCampaignTab === 'configuration'">
          <Button variant="outline" :disabled="!campaign?.id || isEstimating" @click="runEstimate()">
            {{ isEstimating ? "Atualizando estimativa..." : "Atualizar estimativa" }}
          </Button>
          <Button variant="outline" :disabled="isReadonly || isSaving" @click="saveDraft(activeStep)">
            {{ isSaving ? "Salvando..." : "Salvar rascunho" }}
          </Button>
          <Button :disabled="!campaign?.id || isValidating" @click="runValidation">
            {{ isValidating ? "Validando..." : "Validar configuração" }}
          </Button>
          <Button
            v-if="canLaunch"
            :disabled="isLaunching || isDirty"
            @click="isLaunchDialogOpen = true"
          >
            {{ isLaunching ? "Disparando..." : "Validar e disparar" }}
          </Button>
          <Button
            v-if="campaign?.id && !canLaunch && campaign.status !== 'draft'"
            variant="outline"
            @click="router.push({ name: 'campaign-drafts.show', params: { id: campaign.id } })"
          >
            Acompanhar disparo
          </Button>
          <Button
            v-if="canDelete"
            variant="destructive"
            :disabled="isDeleting"
            @click="isDeleteDialogOpen = true"
          >
            {{ isDeleting ? "Excluindo..." : "Excluir draft" }}
          </Button>
        </template>
        <template v-else>
          <Button
            :disabled="!campaign?.id || isReadonly || isDirty || campaignExecutionStore.loading.prepare"
            @click="prepareExecution"
          >
            {{ campaignExecutionStore.loading.prepare ? "Preparando..." : "Preparar campanha" }}
          </Button>
          <Button
            v-if="campaignExecutionStore.canLaunch"
            :disabled="!campaign?.id || isReadonly || isDirty || campaignExecutionStore.loading.launch"
            @click="isExecutionLaunchDialogOpen = true"
          >
            {{ campaignExecutionStore.loading.launch ? "Lançando..." : "Lançar execução" }}
          </Button>
          <Button
            v-if="campaignExecutionStore.canPause"
            variant="secondary"
            :disabled="!campaign?.id || isReadonly || isDirty || campaignExecutionStore.loading.pause"
            @click="pauseExecution"
          >
            {{ campaignExecutionStore.loading.pause ? "Pausando..." : "Pausar" }}
          </Button>
          <Button
            v-if="campaignExecutionStore.canResume"
            :disabled="!campaign?.id || isReadonly || isDirty || campaignExecutionStore.loading.resume"
            @click="resumeExecution"
          >
            {{ campaignExecutionStore.loading.resume ? "Retomando..." : "Retomar" }}
          </Button>
          <Button
            v-if="campaignExecutionStore.canCancel"
            variant="destructive"
            :disabled="!campaign?.id || isReadonly || isDirty || campaignExecutionStore.loading.cancel"
            @click="isExecutionCancelDialogOpen = true"
          >
            {{ campaignExecutionStore.loading.cancel ? "Cancelando..." : "Cancelar execução" }}
          </Button>
          <Button
            variant="outline"
            :disabled="!campaign?.id || campaignExecutionStore.loading.refresh"
            @click="campaign?.id ? campaignExecutionStore.fetchRun(campaign.id).catch(() => {}) : null"
          >
            {{ campaignExecutionStore.loading.refresh ? "Atualizando..." : "Atualizar execução" }}
          </Button>
        </template>
      </div>
    </div>

    <Alert v-if="!activeProjectId && !campaignId" variant="destructive">
      <AlertTitle>Projeto ativo obrigatório</AlertTitle>
      <AlertDescription>Selecione um projeto no workspace antes de criar uma campanha draft.</AlertDescription>
    </Alert>

    <Alert v-if="isReadonly">
      <AlertTitle>Edição bloqueada</AlertTitle>
      <AlertDescription>Esta campanha não está mais em rascunho. A tela permanece disponível apenas para consulta.</AlertDescription>
    </Alert>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card v-if="isInitialLoading">
      <CardContent class="pt-6 text-sm text-muted-foreground">Carregando campanha...</CardContent>
    </Card>

    <Tabs v-else v-model="activeCampaignTab">
      <TabsList class="w-full justify-start">
        <TabsTrigger value="configuration">Configuração</TabsTrigger>
        <TabsTrigger value="execution" :disabled="!campaign?.id">Execução</TabsTrigger>
      </TabsList>

      <TabsContent value="configuration">
        <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Progresso do builder</CardTitle>
              <CardDescription>
                {{ progressSummary }}
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <Progress :model-value="progressValue" />
              <button
                v-for="(step, index) in steps"
                :key="step.key"
                type="button"
                class="w-full rounded-md border px-3 py-3 text-left transition-colors hover:bg-accent"
                :class="activeStep === step.key ? 'bg-accent' : ''"
                @click="activeStep = step.key"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs">
                        {{ index + 1 }}
                      </span>
                      <span class="truncate text-sm font-medium">{{ step.label }}</span>
                    </div>
                    <p v-if="stepSummary(step.key)" class="mt-2 text-xs text-muted-foreground">
                      {{ stepSummary(step.key) }}
                    </p>
                  </div>
                  <Badge v-if="wizardStepFor(step.key)" :variant="progressVariant(wizardStepFor(step.key)?.status || 'missing')">
                    {{ progressStatusLabel(wizardStepFor(step.key)?.status || 'missing') }}
                  </Badge>
                  <Badge v-else-if="step.key === 'recurrence_policy'" variant="outline">
                    {{ form.schedule.schedule_type === "recurring" ? "Opcional" : "N/A" }}
                  </Badge>
                </div>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="pt-6">
              <CampaignBasicStep
                v-if="activeStep === 'basic'"
                v-model="formModel"
                :errors="sectionErrors('basic')"
                :warnings="sectionWarnings('basic')"
                :loading="stepLoading.basic"
                :readonly="isReadonly"
                :on-save="() => saveDraft('basic')"
                @channel-change="onChannelChange"
              />
              <CampaignSingleStageStep
                v-if="activeStep === 'audience'"
                v-model="form.single_stage_config"
                :errors="sectionErrors('audience')"
                :warnings="sectionWarnings('audience')"
                :loading="stepLoading.audience"
                :readonly="isReadonly"
                :on-save="() => saveDraft('audience')"
              />
              <CampaignMessageStep
                v-if="activeStep === 'message'"
                v-model="form.message"
                :errors="sectionErrors('message')"
                :warnings="sectionWarnings('message')"
                :loading="stepLoading.message"
                :readonly="isReadonly"
                :on-save="() => saveDraft('message')"
              />
              <CampaignLinksStep
                v-if="activeStep === 'links'"
                v-model="form.links"
                :detected-links="form.message.detected_links || []"
                :errors="sectionErrors('links')"
                :warnings="sectionWarnings('links')"
                :loading="stepLoading.links"
                :readonly="isReadonly"
                :on-save="() => saveDraft('links')"
              />
              <CampaignScheduleStep
                v-if="activeStep === 'schedule'"
                v-model="form.schedule"
                :errors="sectionErrors('schedule')"
                :warnings="sectionWarnings('schedule')"
                :loading="stepLoading.schedule"
                :readonly="isReadonly"
                :on-save="() => saveDraft('schedule')"
              />
              <CampaignDeliveryWindowsStep
                v-if="activeStep === 'delivery_windows'"
                v-model="form.delivery_windows"
                :errors="sectionErrors('delivery_windows')"
                :warnings="sectionWarnings('delivery_windows')"
                :loading="stepLoading.delivery_windows"
                :readonly="isReadonly"
                :on-save="() => saveDraft('delivery_windows')"
              />
              <CampaignRecurrenceStep
                v-if="activeStep === 'recurrence_policy'"
                v-model="form.recurrence_policy"
                :errors="sectionErrors('recurrence_policy')"
                :warnings="sectionWarnings('recurrence_policy')"
                :loading="stepLoading.recurrence_policy"
                :readonly="isReadonly"
                :is-applicable="form.schedule.schedule_type === 'recurring'"
                :on-save="() => saveDraft('recurrence_policy')"
              />
              <CampaignWarmupStep
                v-if="activeStep === 'warmup_policy'"
                v-model="form.warmup_policy"
                :errors="sectionErrors('warmup_policy')"
                :warnings="sectionWarnings('warmup_policy')"
                :loading="stepLoading.warmup_policy"
                :readonly="isReadonly"
                :on-save="() => saveDraft('warmup_policy')"
              />
            </CardContent>
          </Card>

          <div class="space-y-6">
            <CampaignEstimatePanel
              :estimate="campaignEstimate"
              :loading="isEstimating"
              :disabled="!campaign?.id"
              :error-message="estimateErrorMessage"
              :on-refresh="() => runEstimate()"
            />

            <CampaignChecklistPanel
              :validation="validationResult"
              :loading="isValidating"
              :disabled="!campaign?.id"
            />
          </div>
        </div>

        <div class="mt-6 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" :disabled="activeStepIndex === 0" @click="goToStep(activeStepIndex - 1)">Voltar</Button>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" :disabled="isReadonly || isSaving" @click="saveDraft(activeStep)">
              {{ isSaving ? "Salvando..." : "Salvar" }}
            </Button>
            <Button :disabled="activeStepIndex === steps.length - 1" @click="goToStep(activeStepIndex + 1)">Avançar</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="execution">
        <Alert v-if="campaignExecutionStore.errors.refresh" variant="destructive">
          <AlertTitle>Não foi possível carregar a execução</AlertTitle>
          <AlertDescription>{{ campaignExecutionStore.errors.refresh }}</AlertDescription>
        </Alert>

        <Alert v-if="campaignExecutionStore.errors.prepare" variant="destructive">
          <AlertTitle>Não foi possível preparar a campanha</AlertTitle>
          <AlertDescription>{{ campaignExecutionStore.errors.prepare }}</AlertDescription>
        </Alert>

        <Alert v-if="campaignExecutionStore.errors.launch" variant="destructive">
          <AlertTitle>Não foi possível lançar a execução</AlertTitle>
          <AlertDescription>{{ campaignExecutionStore.errors.launch }}</AlertDescription>
        </Alert>

        <Alert v-if="campaignExecutionStore.errors.pause" variant="destructive">
          <AlertTitle>Não foi possível pausar a execução</AlertTitle>
          <AlertDescription>{{ campaignExecutionStore.errors.pause }}</AlertDescription>
        </Alert>

        <Alert v-if="campaignExecutionStore.errors.resume" variant="destructive">
          <AlertTitle>Não foi possível retomar a execução</AlertTitle>
          <AlertDescription>{{ campaignExecutionStore.errors.resume }}</AlertDescription>
        </Alert>

        <Alert v-if="campaignExecutionStore.errors.cancel" variant="destructive">
          <AlertTitle>Não foi possível cancelar a execução</AlertTitle>
          <AlertDescription>{{ campaignExecutionStore.errors.cancel }}</AlertDescription>
        </Alert>

        <Card v-if="campaignExecutionStore.loading.refresh && !campaignExecutionStore.hasRun">
          <CardContent class="pt-6 text-sm text-muted-foreground">Carregando execução...</CardContent>
        </Card>

        <Card v-else-if="!campaignExecutionStore.hasRun">
          <CardHeader>
            <CardTitle>Execução</CardTitle>
            <CardDescription>Sem execução preparada.</CardDescription>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">
            Prepare a campanha para materializar o run e visualizar os dados operacionais.
          </CardContent>
        </Card>

        <div v-else class="space-y-6">
          <Card v-if="campaignExecutionStore.lastPrepareResult">
            <CardHeader>
              <CardTitle>Preparação</CardTitle>
              <CardDescription>
                Resumo do último preparo realizado nesta sessão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Status</div>
                  <div class="text-sm font-medium">
                    {{ CAMPAIGN_RUN_STATUS_LABELS[campaignExecutionStore.lastPrepareResult.status] }}
                  </div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Destinatários</div>
                  <div class="text-sm font-medium">{{ campaignExecutionStore.lastPrepareResult.total_recipients }}</div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Waves</div>
                  <div class="text-sm font-medium">{{ campaignExecutionStore.lastPrepareResult.waves }}</div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Batches</div>
                  <div class="text-sm font-medium">{{ campaignExecutionStore.lastPrepareResult.batches }}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <CampaignRunProgressPanel v-if="campaignExecutionStore.run" :run="campaignExecutionStore.run" />

          <CampaignWavesBatchesPanel
            :campaign-id="campaign?.id ?? null"
            :waves="campaignExecutionStore.waves"
            :loading="campaignExecutionStore.loading.refresh"
            :on-refresh-batches="() => (campaign?.id ? campaignExecutionStore.fetchRunBatches(campaign.id) : undefined)"
          />

          <CampaignRecipientsPanel
            :campaign-id="campaign?.id ?? null"
            :active="activeCampaignTab === 'execution'"
          />

          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
              <CardDescription>Marcos principais do run.</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Preparada em</div>
                  <div class="text-sm">{{ formatDateTime(campaignExecutionStore.run?.prepared_at ?? null) }}</div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Iniciada em</div>
                  <div class="text-sm">{{ formatDateTime(campaignExecutionStore.run?.started_at ?? null) }}</div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Pausada em</div>
                  <div class="text-sm">{{ formatDateTime(campaignExecutionStore.run?.paused_at ?? null) }}</div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Retomada em</div>
                  <div class="text-sm">{{ formatDateTime(campaignExecutionStore.run?.resumed_at ?? null) }}</div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Cancelada em</div>
                  <div class="text-sm">{{ formatDateTime(campaignExecutionStore.run?.canceled_at ?? null) }}</div>
                </div>
                <div class="rounded-md border p-3">
                  <div class="text-xs text-muted-foreground">Finalizada em</div>
                  <div class="text-sm">{{ formatDateTime(campaignExecutionStore.run?.finished_at ?? null) }}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <AlertDialog :open="isExecutionLaunchDialogOpen" @update:open="isExecutionLaunchDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lançar execução</AlertDialogTitle>
          <AlertDialogDescription>
            Isto irá iniciar o processamento assíncrono da execução (run) da campanha.
            Confirme apenas se você já preparou a campanha e deseja iniciar o envio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction :disabled="campaignExecutionStore.loading.launch" @click="confirmExecutionLaunch">
            {{ campaignExecutionStore.loading.launch ? "Lançando..." : "Confirmar lançamento" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog :open="isExecutionCancelDialogOpen" @update:open="isExecutionCancelDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar execução</AlertDialogTitle>
          <AlertDialogDescription>
            Atenção: o cancelamento interrompe a execução e pode cancelar/envio pendente.
            Mensagens já processadas não serão revertidas. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            :disabled="campaignExecutionStore.loading.cancel"
            @click="confirmExecutionCancel"
          >
            {{ campaignExecutionStore.loading.cancel ? "Cancelando..." : "Confirmar cancelamento" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog :open="isLaunchDialogOpen" @update:open="isLaunchDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disparar campanha</AlertDialogTitle>
          <AlertDialogDescription>
            A campanha <strong>{{ campaign?.name }}</strong> será validada e enviada para o pipeline de disparo
            <template v-if="form.channel === 'email'"> via SMTP (e-mail).</template>
            <template v-else> via SMS Funnel.</template>
            <span v-if="campaignEstimate">
              Estimativa: <strong>{{ campaignEstimate.audience.estimated_recipients }}</strong> destinatário(s)<template v-if="form.channel === 'email'">
              / <strong>{{ campaignEstimate.message.estimated_emails ?? campaignEstimate.message.estimated_messages }}</strong> e-mail(s)</template><template v-else>,
              <strong>{{ campaignEstimate.message.estimated_sms_segments }}</strong> segmento(s) de SMS</template><template v-if="campaignEstimate.financial.estimated_cost !== null">,
              custo estimado de <strong>{{ formatCurrency(campaignEstimate.financial.estimated_cost) }}</strong></template>.
            </span>
            Esta ação não pode ser desfeita após o início do envio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction :disabled="isLaunching" @click="confirmLaunch">
            {{ isLaunching ? "Disparando..." : "Confirmar disparo" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir campanha draft</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação remove permanentemente a campanha <strong>{{ campaign?.name }}</strong>. Ela só está disponível enquanto o estado for <strong>draft</strong>.
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
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
import { toast } from "vue-sonner";
import CampaignBasicStep from "@/components/campaigns/CampaignBasicStep.vue";
import CampaignChecklistPanel from "@/components/campaigns/CampaignChecklistPanel.vue";
import CampaignDeliveryWindowsStep from "@/components/campaigns/CampaignDeliveryWindowsStep.vue";
import CampaignEstimatePanel from "@/components/campaigns/CampaignEstimatePanel.vue";
import CampaignLinksStep from "@/components/campaigns/CampaignLinksStep.vue";
import CampaignMessageStep from "@/components/campaigns/CampaignMessageStep.vue";
import CampaignRecurrenceStep from "@/components/campaigns/CampaignRecurrenceStep.vue";
import CampaignScheduleStep from "@/components/campaigns/CampaignScheduleStep.vue";
import CampaignSingleStageStep from "@/components/campaigns/CampaignSingleStageStep.vue";
import CampaignWarmupStep from "@/components/campaigns/CampaignWarmupStep.vue";
import {
  createCampaign,
  deleteCampaign,
  estimateCampaign,
  getCampaign,
  launchCampaign,
  updateCampaign,
  validateCampaign,
} from "@/services/campaigns";
import type {
  CampaignConfigurationProgress,
  CampaignDetail,
  CampaignEstimateResponse,
  CampaignFormState,
  CampaignStatus,
  CampaignStorePayload,
  CampaignUpdatePayload,
  CampaignValidationResponse,
  CampaignWizardStep,
  CampaignWizardStepKey,
} from "@/contracts/campaigns";
import {
  CAMPAIGN_PROGRESS_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
} from "@/contracts/campaigns";
import {
  CAMPAIGN_RUN_STATUS_LABELS,
} from "@/contracts/campaignExecution";
import { useCampaignExecutionStore } from "@/stores/campaignExecution";
import CampaignRunProgressPanel from "@/components/campaigns/CampaignRunProgressPanel.vue";
import CampaignWavesBatchesPanel from "@/components/campaigns/CampaignWavesBatchesPanel.vue";
import CampaignRecipientsPanel from "@/components/campaigns/CampaignRecipientsPanel.vue";

type StepKey =
  | "basic"
  | "audience"
  | "message"
  | "links"
  | "schedule"
  | "delivery_windows"
  | "recurrence_policy"
  | "warmup_policy";

type HttpLikeError = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string | string[]>;
    };
  };
};

type StepDefinition = {
  key: StepKey;
  label: string;
  sectionKeys: string[];
  progressKey?: CampaignWizardStepKey;
};

const steps: StepDefinition[] = [
  { key: "basic", label: "Dados básicos", sectionKeys: ["campaign", "channels"], progressKey: "channels" },
  { key: "audience", label: "Público", sectionKeys: ["audience", "campaign"], progressKey: "audience" },
  { key: "message", label: "Mensagem", sectionKeys: ["message"], progressKey: "message" },
  { key: "links", label: "Links", sectionKeys: ["links"], progressKey: "links" },
  { key: "schedule", label: "Agendamento", sectionKeys: ["schedule"], progressKey: "schedule" },
  { key: "delivery_windows", label: "Janelas", sectionKeys: ["delivery_windows"], progressKey: "delivery_windows" },
  { key: "recurrence_policy", label: "Recorrência", sectionKeys: ["recurrence_policy"] },
  { key: "warmup_policy", label: "Warmup", sectionKeys: ["warmup", "warmup_policy"], progressKey: "warmup" },
];

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const campaignExecutionStore = useCampaignExecutionStore();

const campaign = ref<CampaignDetail | null>(null);
const configurationProgress = ref<CampaignConfigurationProgress | null>(null);
const campaignEstimate = ref<CampaignEstimateResponse | null>(null);
const validationResult = ref<CampaignValidationResponse | null>(null);
const activeStep = ref<StepKey>("basic");
const activeCampaignTab = ref<"configuration" | "execution">("configuration");
const isDirty = ref(false);
const isSaving = ref(false);
const isValidating = ref(false);
const isEstimating = ref(false);
const isDeleting = ref(false);
const isLaunching = ref(false);
const isInitialLoading = ref(false);
const isDeleteDialogOpen = ref(false);
const isLaunchDialogOpen = ref(false);
const isExecutionLaunchDialogOpen = ref(false);
const isExecutionCancelDialogOpen = ref(false);
const errorMessage = ref("");
const estimateErrorMessage = ref("");
const suppressDirty = ref(false);
const validationErrors = ref<Record<string, { field: string; message: string }[]>>({});
const validationWarnings = ref<Record<string, { field: string; message: string }[]>>({});
let executionPollTimeout: number | null = null;
let executionPollInFlight = false;
const handleVisibilityChange = () => {
  if (typeof document === "undefined") return;
  if (document.hidden) {
    stopExecutionPolling();
  } else {
    scheduleExecutionPolling();
  }
};

const stepLoading = reactive<Record<StepKey, boolean>>({
  basic: false,
  audience: false,
  message: false,
  links: false,
  schedule: false,
  delivery_windows: false,
  recurrence_policy: false,
  warmup_policy: false,
});

const form = reactive<CampaignFormState>(createEmptyForm());
const formModel = computed({
  get: () => form,
  set: (value: CampaignFormState) => {
    Object.assign(form, value);
  },
});

function onChannelChange(channel: "sms" | "email") {
  form.channel = channel;
  form.message.channel = channel;
  if (channel === "email") {
    form.message.sms_segments_count = 0;
  }
  if (channel === "sms" && form.message.subject == null) {
    form.message.subject = "";
  }
}

const campaignId = computed(() => {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
});

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

async function prepareExecution() {
  if (!campaign.value?.id) return;

  try {
    const result = await campaignExecutionStore.prepare(campaign.value.id);
    toast("Campanha preparada.", { description: `${result.total_recipients} destinatário(s) · ${result.waves} wave(s) · ${result.batches} batch(es).` });
  } catch {
    // erro já foi mapeado no store (errors.prepare)
  }
}

function desiredExecutionPollMs(): number | null {
  if (typeof document === "undefined") return null;
  if (document.hidden) return null;
  if (activeCampaignTab.value !== "execution") return null;
  if (!campaign.value?.id) return null;
  if (!campaignExecutionStore.hasRun) return null;
  if (campaignExecutionStore.isRunFinal) return null;

  const status = campaignExecutionStore.runStatus;
  if (status === "running") return 5000;
  if (status === "paused" || status === "prepared") return 20000;
  return null;
}

function scheduleExecutionPolling() {
  if (executionPollTimeout) {
    window.clearTimeout(executionPollTimeout);
    executionPollTimeout = null;
  }

  const ms = desiredExecutionPollMs();
  if (!ms) return;

  executionPollTimeout = window.setTimeout(async () => {
    executionPollTimeout = null;
    const campaignId = campaign.value?.id;
    if (!campaignId) return;
    if (!desiredExecutionPollMs()) return;

    if (executionPollInFlight) {
      scheduleExecutionPolling();
      return;
    }

    executionPollInFlight = true;
    try {
      await campaignExecutionStore.fetchRun(campaignId);
    } catch {
      // erros já são armazenados no store (errors.refresh)
    } finally {
      executionPollInFlight = false;
    }

    scheduleExecutionPolling();
  }, ms);
}

function stopExecutionPolling() {
  if (!executionPollTimeout) return;
  window.clearTimeout(executionPollTimeout);
  executionPollTimeout = null;
}

async function confirmExecutionLaunch() {
  if (!campaign.value?.id) return;

  try {
    await campaignExecutionStore.launch(campaign.value.id);
    toast("Execução lançada.", { description: "O processamento assíncrono foi iniciado." });
    isExecutionLaunchDialogOpen.value = false;
    scheduleExecutionPolling();
  } catch {
    // erro já foi mapeado no store (errors.launch)
    isExecutionLaunchDialogOpen.value = false;
  }
}

async function pauseExecution() {
  if (!campaign.value?.id) return;

  try {
    await campaignExecutionStore.pause(campaign.value.id);
    toast("Execução pausada.");
  } catch {
    // erro já foi mapeado no store (errors.pause)
  }
}

async function resumeExecution() {
  if (!campaign.value?.id) return;

  try {
    await campaignExecutionStore.resume(campaign.value.id);
    toast("Execução retomada.");
  } catch {
    // erro já foi mapeado no store (errors.resume)
  }
}

async function confirmExecutionCancel() {
  if (!campaign.value?.id) return;

  try {
    await campaignExecutionStore.cancel(campaign.value.id);
    toast("Execução cancelada.");
    isExecutionCancelDialogOpen.value = false;
  } catch {
    // erro já foi mapeado no store (errors.cancel)
    isExecutionCancelDialogOpen.value = false;
  }
}

const activeProjectId = computed(() => {
  const numeric = Number(workspaceStore.activeGroupProject?.project_id);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
});

const activeStepIndex = computed(() => steps.findIndex((step) => step.key === activeStep.value));
const progressValue = computed(() => {
  if (configurationProgress.value && configurationProgress.value.total_steps > 0) {
    return (configurationProgress.value.completed_steps / configurationProgress.value.total_steps) * 100;
  }

  return ((activeStepIndex.value + 1) / steps.length) * 100;
});
const progressSummary = computed(() => {
  if (!configurationProgress.value) {
    return "O progresso por etapa aparecerá após o primeiro salvamento.";
  }

  return `${configurationProgress.value.completed_steps} de ${configurationProgress.value.total_steps} etapas válidas`;
});
const isReadonly = computed(() => Boolean(campaign.value && campaign.value.status !== "draft"));
const canDelete = computed(() => Boolean(campaign.value?.id && campaign.value.status === "draft"));
const canLaunch = computed(() =>
  Boolean(
    campaign.value?.id &&
      ["draft", "validation_failed", "validated"].includes(campaign.value.status),
  ),
);
const statusLabel = computed(() => CAMPAIGN_STATUS_LABELS[(campaign.value?.status || "draft") as CampaignStatus]);

watch(
  form,
  () => {
    if (!suppressDirty.value) {
      isDirty.value = true;
    }
  },
  { deep: true },
);

onMounted(async () => {
  if (campaignId.value) {
    await loadCampaignContext(campaignId.value);
  }
});

onMounted(() => {
  if (typeof document === "undefined") return;
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

watch(
  [activeCampaignTab, () => campaign.value?.id],
  async ([tab, id]) => {
    if (tab !== "execution") return;
    if (!id) return;
    try {
      await campaignExecutionStore.fetchRun(id);
    } catch {
      // erros já são armazenados no store (errors.refresh)
    }
  },
  { immediate: false },
);

watch(
  [
    activeCampaignTab,
    () => campaign.value?.id,
    () => campaignExecutionStore.hasRun,
    () => campaignExecutionStore.runStatus,
    () => campaignExecutionStore.isRunFinal,
  ],
  () => {
    scheduleExecutionPolling();
  },
  { immediate: false },
);

onBeforeUnmount(() => {
  stopExecutionPolling();
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
});

function createEmptyForm(): CampaignFormState {
  return {
    name: "",
    description: null,
    type: "broadcast",
    channel: "sms",
    metadata: null,
    single_stage_config: {
      target_audience_id: null,
      audience_mode: "none",
      apply_protection_list: true,
      apply_opt_out: true,
      apply_suppression: true,
      daily_recipient_cap: null,
      total_recipient_cap: null,
      eligibility_rules: null,
      metadata: null,
    },
    message: {
      channel: "sms",
      locale: "",
      subject: "",
      body: "",
      character_count: 0,
      sms_segments_count: 0,
      detected_links: [],
      variables: [],
      metadata: null,
    },
    links: [],
    schedule: {
      schedule_type: "scheduled",
      timezone: "America/Sao_Paulo",
      starts_at: null,
      ends_at: null,
      respect_delivery_windows: true,
      metadata: null,
    },
    delivery_windows: [
      { day_of_week: 1, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 2, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 3, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 4, starts_at: "10:00", ends_at: "18:00", is_active: true },
      { day_of_week: 5, starts_at: "10:00", ends_at: "18:00", is_active: true },
    ],
    recurrence_policy: {
      is_enabled: false,
      frequency: "weekly",
      interval: 1,
      days_of_week: [],
      days_of_month: [],
      repeat_until: null,
      max_occurrences: null,
      metadata: null,
    },
    warmup_policy: {
      is_enabled: false,
      initial_limit: null,
      increment_amount: null,
      increment_type: "fixed",
      interval_unit: "day",
      interval_value: 1,
      max_limit: null,
      metadata: null,
    },
  };
}

async function loadCampaignContext(id: number) {
  isInitialLoading.value = true;
  errorMessage.value = "";

  try {
    const detail = await getCampaign(id);
    campaign.value = detail;
    configurationProgress.value = detail.configuration_progress || null;
    applyCampaignDetail(detail);
    isDirty.value = false;
    await runEstimate(id, false);
  } catch (error) {
    handleHttpError(error);
  } finally {
    isInitialLoading.value = false;
  }
}

function applyCampaignDetail(detail: CampaignDetail) {
  suppressDirty.value = true;
  Object.assign(form, createEmptyForm(), {
    name: detail.name,
    description: detail.description,
    type: detail.type,
    channel: detail.channel,
    metadata: detail.metadata,
    single_stage_config: {
      ...createEmptyForm().single_stage_config,
      ...(detail.single_stage_config || {}),
    },
    message: {
      ...createEmptyForm().message,
      ...((detail.messages && detail.messages[0]) || {}),
    },
    links: detail.links || [],
    schedule: {
      ...createEmptyForm().schedule,
      ...(detail.schedule || {}),
      starts_at: toDateTimeLocal(detail.schedule?.starts_at || null),
      ends_at: toDateTimeLocal(detail.schedule?.ends_at || null),
    },
    delivery_windows: detail.delivery_windows?.length ? detail.delivery_windows : createEmptyForm().delivery_windows,
    recurrence_policy: {
      ...createEmptyForm().recurrence_policy,
      ...(detail.recurrence_policy || {}),
      repeat_until: detail.recurrence_policy?.repeat_until?.slice(0, 10) || null,
    },
    warmup_policy: {
      ...createEmptyForm().warmup_policy,
      ...(detail.warmup_policy || {}),
    },
  });
  window.setTimeout(() => {
    suppressDirty.value = false;
  }, 0);
}

async function saveDraft(step: StepKey) {
  if (isReadonly.value) return;

  errorMessage.value = "";
  clearStepMessages(step);
  stepLoading[step] = true;
  isSaving.value = true;

  try {
    if (!campaign.value?.id) {
      const detail = await createCampaign(buildStorePayload());
      campaign.value = detail;
      configurationProgress.value = detail.configuration_progress || null;
      applyCampaignDetail(detail);
      await router.replace({ name: "campaign-drafts.edit", params: { id: detail.id } });
      await runEstimate(detail.id, false);
      toast("Campanha criada como draft.");
    } else {
      await updateCampaign(campaign.value.id, buildUpdatePayload());
      await loadCampaignContext(campaign.value.id);
      clearValidationState();
      toast("Rascunho salvo.");
    }
    isDirty.value = false;
  } catch (error) {
    handleHttpError(error, step);
  } finally {
    stepLoading[step] = false;
    isSaving.value = false;
  }
}

async function runEstimate(id = campaign.value?.id, surfaceErrors = true) {
  if (!id) return;

  isEstimating.value = true;
  estimateErrorMessage.value = "";

  try {
    campaignEstimate.value = await estimateCampaign(id);
  } catch (error) {
    estimateErrorMessage.value = extractHttpMessage(error, "Não foi possível calcular a estimativa da campanha.");
    if (surfaceErrors) {
      errorMessage.value = estimateErrorMessage.value;
    }
  } finally {
    isEstimating.value = false;
  }
}

async function runValidation() {
  if (!campaign.value?.id) return;

  errorMessage.value = "";
  isValidating.value = true;
  try {
    const result = await validateCampaign(campaign.value.id);
    validationResult.value = result;
    validationErrors.value = result.errors || {};
    validationWarnings.value = result.warnings || {};
    configurationProgress.value = result.configuration_progress || configurationProgress.value;

    const firstStep = steps.find((step) => {
      const wizardStep = wizardStepFor(step.key);
      return wizardStep && wizardStep.status !== "valid";
    });
    if (firstStep) {
      activeStep.value = firstStep.key;
    }

    toast(result.valid ? "Configuração válida." : "Configuração inválida.");
  } catch (error) {
    handleHttpError(error);
  } finally {
    isValidating.value = false;
  }
}

async function confirmLaunch() {
  if (!campaign.value?.id) return;

  isLaunching.value = true;
  errorMessage.value = "";

  try {
    await launchCampaign(campaign.value.id);
    toast("Campanha enviada para disparo.");
    isLaunchDialogOpen.value = false;
    await router.push({ name: "campaign-drafts.show", params: { id: campaign.value.id } });
  } catch (error) {
    isLaunchDialogOpen.value = false;

    if (isHttpLikeError(error) && error.response?.status === 422) {
      const data = error.response.data as {
        message?: string;
        data?: CampaignValidationResponse;
      };

      if (data?.data?.errors) {
        validationResult.value = data.data;
        validationErrors.value = data.data.errors || {};
        validationWarnings.value = data.data.warnings || {};
        configurationProgress.value = data.data.configuration_progress || configurationProgress.value;
      }

      errorMessage.value = data?.message || "A campanha possui erros de configuração e não pode ser disparada.";
      return;
    }

    handleHttpError(error);
  } finally {
    isLaunching.value = false;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

async function confirmDelete() {
  if (!campaign.value?.id || campaign.value.status !== "draft") return;

  isDeleting.value = true;
  errorMessage.value = "";
  try {
    await deleteCampaign(campaign.value.id);
    toast("Campanha draft excluída.");
    await router.push({ name: "campaign-drafts.index" });
  } catch (error) {
    handleHttpError(error);
  } finally {
    isDeleting.value = false;
    isDeleteDialogOpen.value = false;
  }
}

function buildStorePayload(): CampaignStorePayload {
  if (!activeProjectId.value || !form.name.trim()) {
    throw new Error("Informe um projeto ativo e o nome para criar o draft.");
  }

  return {
    project_id: activeProjectId.value,
    name: form.name,
    description: form.description,
    type: "broadcast",
    channel: form.channel,
    metadata: form.metadata,
    single_stage_config: form.single_stage_config,
    message: {
      ...form.message,
      channel: form.channel,
    },
    links: form.links,
    schedule: form.schedule,
    delivery_windows: form.delivery_windows,
    recurrence_policy: form.recurrence_policy,
    warmup_policy: form.warmup_policy,
  };
}

function buildUpdatePayload(): CampaignUpdatePayload {
  return {
    name: form.name,
    description: form.description,
    type: "broadcast",
    channel: form.channel,
    metadata: form.metadata,
    single_stage_config: form.single_stage_config,
    message: {
      ...form.message,
      channel: form.channel,
    },
    links: form.links,
    schedule: form.schedule,
    delivery_windows: form.delivery_windows,
    recurrence_policy: form.recurrence_policy,
    warmup_policy: form.warmup_policy,
  };
}

function wizardStepFor(stepKey: StepKey): CampaignWizardStep | undefined {
  const progressKey = steps.find((step) => step.key === stepKey)?.progressKey;
  if (!progressKey || !configurationProgress.value) return undefined;
  return configurationProgress.value.steps.find((step) => step.key === progressKey);
}

function stepSummary(stepKey: StepKey) {
  const wizardStep = wizardStepFor(stepKey);
  if (wizardStep?.summary) return wizardStep.summary;
  if (wizardStep?.pending_fields.length) return `${wizardStep.pending_fields.length} campo(s) pendente(s)`;
  if (wizardStep?.issues.length) return `${wizardStep.issues.length} problema(s) encontrado(s)`;
  if (stepKey === "recurrence_policy" && form.schedule.schedule_type !== "recurring") {
    return "Esta etapa só é útil quando o agendamento for recorrente.";
  }
  return "";
}

function sectionErrors(stepKey: StepKey) {
  return mergeMessages(steps.find((step) => step.key === stepKey)?.sectionKeys || [], validationErrors.value);
}

function sectionWarnings(stepKey: StepKey) {
  return mergeMessages(steps.find((step) => step.key === stepKey)?.sectionKeys || [], validationWarnings.value);
}

function mergeMessages(sectionKeys: string[], source: Record<string, { field: string; message: string }[]>) {
  return sectionKeys.flatMap((key) => source[key] || []);
}

function clearStepMessages(stepKey: StepKey) {
  const step = steps.find((item) => item.key === stepKey);
  if (!step) return;

  validationErrors.value = { ...validationErrors.value };
  validationWarnings.value = { ...validationWarnings.value };
  step.sectionKeys.forEach((key) => {
    validationErrors.value[key] = [];
    validationWarnings.value[key] = [];
  });
}

function clearValidationState() {
  validationResult.value = null;
  validationErrors.value = {};
  validationWarnings.value = {};
}

function goToStep(index: number) {
  const step = steps[index];
  if (step) activeStep.value = step.key;
}

function toDateTimeLocal(value: string | null) {
  return value ? value.slice(0, 16) : null;
}

function progressVariant(status: "missing" | "partial" | "valid") {
  if (status === "missing") return "destructive";
  if (status === "partial") return "secondary";
  return "default";
}

function progressStatusLabel(status: "missing" | "partial" | "valid") {
  return CAMPAIGN_PROGRESS_STATUS_LABELS[status];
}

function statusVariant(status: CampaignStatus) {
  if (status === "draft" || status === "validated") return "outline";
  if (status === "validation_failed" || status === "archived" || status === "canceled") return "destructive";
  if (status === "validating" || status === "paused") return "secondary";
  return "default";
}

function handleHttpError(error: unknown, step?: StepKey) {
  if (!isHttpLikeError(error)) {
    errorMessage.value = "Erro inesperado.";
    return;
  }

  const status = error.response?.status;

  if (!error.response && error.message) {
    errorMessage.value = error.message;
    return;
  }

  if (status === 403) {
    errorMessage.value = "Você não tem permissão para executar esta ação.";
    return;
  }

  if (status === 422) {
    const errors = error.response?.data?.errors || {};
    const items = Object.entries(errors).flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages.map((message) => ({ field, message: String(message) }))
        : [{ field, message: String(messages) }],
    );
    const key = steps.find((item) => item.key === step)?.sectionKeys[0] || "campaign";
    validationErrors.value = { ...validationErrors.value, [key]: items };
    errorMessage.value = "Revise os campos destacados antes de continuar.";
    return;
  }

  errorMessage.value = error.response?.data?.message || "Erro inesperado ao comunicar com o servidor.";
}

function extractHttpMessage(error: unknown, fallback: string) {
  if (isHttpLikeError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function isHttpLikeError(error: unknown): error is HttpLikeError {
  return typeof error === "object" && error !== null && ("response" in error || "message" in error);
}
</script>
