<template>
  <div
    class="w-full"
    :class="wizardMode === 'broadcast'
      ? 'space-y-6 p-10 max-[450px]:p-2 pb-16'
      : '-mx-4 -mb-4 flex h-[calc(100dvh-4rem)] flex-col sm:-mx-6 sm:-mb-0'"
  >
    <div
      v-if="wizardMode !== 'broadcast'"
      class="flex items-center justify-between gap-2 px-6 pt-4 pb-1 max-[450px]:px-2"
    >
      <nav class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Marketing</span>
        <ChevronRight class="size-3" />
        <router-link :to="{ name: 'campaign-drafts.index' }" class="transition-colors hover:text-foreground">
          Campanhas
        </router-link>
        <ChevronRight class="size-3" />
        <span class="text-foreground">{{ campaign?.name || "Nova campanha" }}</span>
      </nav>
      <div class="flex items-center gap-2">
        <Badge v-if="campaign" :variant="statusVariant(campaign.status)">{{ statusLabel }}</Badge>
        <Badge v-if="isDirty" variant="secondary">Alterações locais</Badge>
        <Badge variant="secondary">Projeto: {{ activeProjectLabel }}</Badge>
        <template v-if="isFlowMode && campaign?.id">
          <Button
            v-if="canActivateFlow"
            size="sm"
            :disabled="isDirty || flowAction !== null"
            :title="isDirty ? 'Salve as alterações antes de ativar.' : undefined"
            @click="isFlowActivateDialogOpen = true"
          >
            <Play class="mr-1 size-3.5" />
            {{ flowAction === "launch" ? "Ativando..." : "Ativar jornada" }}
          </Button>
          <Button
            v-if="campaign.status === 'running'"
            size="sm"
            variant="secondary"
            :disabled="flowAction !== null"
            @click="runFlowAction('pause')"
          >
            <Pause class="mr-1 size-3.5" />
            {{ flowAction === "pause" ? "Pausando..." : "Pausar" }}
          </Button>
          <Button
            v-if="campaign.status === 'paused'"
            size="sm"
            :disabled="flowAction !== null"
            @click="runFlowAction('resume')"
          >
            <Play class="mr-1 size-3.5" />
            {{ flowAction === "resume" ? "Retomando..." : "Retomar" }}
          </Button>
          <Button
            v-if="campaign.status === 'running' || campaign.status === 'paused'"
            size="sm"
            variant="destructive"
            :disabled="flowAction !== null"
            @click="isFlowCancelDialogOpen = true"
          >
            <Square class="mr-1 size-3.5" />
            {{ flowAction === "cancel" ? "Encerrando..." : "Encerrar" }}
          </Button>
        </template>
      </div>
    </div>

    <div v-if="wizardMode === 'broadcast'" class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
            v-if="canLaunch && !isFlowMode"
            :disabled="isLaunching || isDirty"
            @click="isLaunchDialogOpen = true"
          >
            {{ isLaunching ? "Disparando..." : "Validar e disparar" }}
          </Button>
          <Button
            v-if="campaign?.id && !canLaunch && campaign.status !== 'draft' && !isFlowMode"
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

    <Alert v-if="!activeProjectId && !campaignId" variant="destructive" :class="wizardMode !== 'broadcast' ? 'mx-6 mt-3 max-[450px]:mx-2' : ''">
      <AlertTitle>Projeto ativo obrigatório</AlertTitle>
      <AlertDescription>Selecione um projeto no workspace antes de criar uma campanha draft.</AlertDescription>
    </Alert>

    <Alert v-if="isReadonly" :class="wizardMode !== 'broadcast' ? 'mx-6 mt-3 max-[450px]:mx-2' : ''">
      <AlertTitle>Edição bloqueada</AlertTitle>
      <AlertDescription>Esta campanha não está mais em rascunho. A tela permanece disponível apenas para consulta.</AlertDescription>
    </Alert>

    <Alert v-if="errorMessage" variant="destructive" :class="wizardMode !== 'broadcast' ? 'mx-6 mt-3 max-[450px]:mx-2' : ''">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card v-if="isInitialLoading" :class="wizardMode !== 'broadcast' ? 'mx-6 mt-3 max-[450px]:mx-2' : ''">
      <CardContent class="pt-6 text-sm text-muted-foreground">Carregando campanha...</CardContent>
    </Card>

    <Tabs v-else v-model="activeCampaignTab" :class="wizardMode !== 'broadcast' ? 'flex min-h-0 flex-1 flex-col' : ''">
      <TabsList :class="wizardMode !== 'broadcast' ? 'hidden' : 'w-full justify-start'">
        <TabsTrigger value="configuration">Configuração</TabsTrigger>
        <TabsTrigger v-if="!isFlowMode" value="execution" :disabled="!campaign?.id">Execução</TabsTrigger>
      </TabsList>

      <TabsContent value="configuration" :class="wizardMode !== 'broadcast' ? 'flex min-h-0 flex-1 flex-col' : ''">
        <div v-if="wizardMode !== 'broadcast'" class="flex min-h-0 flex-1 flex-col">
          <template v-if="activeStep === 'flow_editor' && wizardMode === 'flow'">
            <FlowEditorCanvas
              v-model="form.flow_config"
              :catalog="flowNodeTypes"
              :templates="flowCatalog?.templates || []"
              :catalog-loading="isFlowCatalogLoading"
              :readonly="isReadonly"
              :saving="isSaving"
              :stats="flowStats?.nodes || null"
              class="min-h-0 flex-1"
              @save="saveFlowAndContinue"
            />
            <p v-if="flowCatalogError" class="px-6 py-2 text-sm text-destructive">{{ flowCatalogError }}</p>
          </template>

          <div v-else class="min-h-0 flex-1 overflow-y-auto">
            <nav class="flex justify-center overflow-x-auto px-6 pt-8">
              <ol class="flex items-start gap-8 sm:gap-16">
                <li v-for="(step, index) in flowSteps" :key="step.key">
                  <button
                    type="button"
                    class="flex w-28 flex-col items-center gap-2"
                    :disabled="wizardMode !== 'flow'"
                    @click="goToStep(index)"
                  >
                    <span
                      class="flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors"
                      :class="flowStepCircleClass(index)"
                    >
                      <Check v-if="index < flowStepperIndex" class="size-4" />
                      <template v-else>{{ index + 1 }}</template>
                    </span>
                    <span
                      class="text-center text-xs font-medium"
                      :class="index === flowStepperIndex ? 'text-foreground' : 'text-muted-foreground'"
                    >
                      {{ step.label }}
                    </span>
                    <Badge
                      v-if="wizardStepFor(step.key)"
                      :variant="progressVariant(wizardStepFor(step.key)?.status || 'missing')"
                      class="px-1.5 py-0 text-[10px]"
                    >
                      {{ progressStatusLabel(wizardStepFor(step.key)?.status || 'missing') }}
                    </Badge>
                  </button>
                </li>
              </ol>
            </nav>

            <div v-if="flowStepperIndex === 0" class="mx-auto w-full max-w-2xl px-6 pb-10 pt-8">
              <div class="mb-8 flex items-center gap-2">
                <Lightbulb class="size-5 text-muted-foreground" />
                <h2 class="text-xl font-bold tracking-tight">
                  {{ campaignId ? "Editar campanha" : "Nova campanha" }}
                </h2>
              </div>
              <CampaignTypeStep
                v-model="formModel"
                :errors="sectionErrors('campaign_type')"
                :warnings="sectionWarnings('campaign_type')"
                :loading="stepLoading.campaign_type"
                :readonly="isReadonly"
                :selection-locked="wizardMode === 'flow' && Boolean(campaignId)"
                :initial-selected="wizardMode === 'select' ? null : form.type"
                @continue="onTypeStepContinue"
                @back="onTypeStepBack"
              />
            </div>

            <div v-else class="mx-auto w-full max-w-4xl space-y-6 px-6 pb-10 pt-8">
              <Card v-if="flowStats">
                <CardHeader>
                  <CardTitle>Resultados da jornada</CardTitle>
                  <CardDescription>Jogadores que entraram pelo gatilho desde a ativação.</CardDescription>
                </CardHeader>
                <CardContent class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <div class="text-xs text-muted-foreground">Entraram</div>
                    <div class="text-lg font-semibold">{{ formatCount(flowStats.enrollments.total) }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-muted-foreground">Em andamento</div>
                    <div class="text-lg font-semibold">{{ formatCount(flowStats.enrollments.open) }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-muted-foreground">Convertidos</div>
                    <div class="text-lg font-semibold">{{ formatCount(flowStats.enrollments.converted) }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-muted-foreground">Valor convertido</div>
                    <div class="text-lg font-semibold">{{ formatCurrency(flowStats.enrollments.conversion_value / 100) }}</div>
                  </div>
                </CardContent>
              </Card>
              <FlowSummaryPanel :definition="form.flow_config?.definition || null" />
              <FlowEstimatePanel
                :estimate="flowEstimate"
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
              <CampaignValidationList
                :errors="sectionErrors('flow_review').length ? sectionErrors('flow_review') : sectionErrors('flow_editor')"
                :warnings="sectionWarnings('flow_review').length ? sectionWarnings('flow_review') : sectionWarnings('flow_editor')"
              />
              <div class="flex items-center justify-between">
                <Button variant="outline" @click="activeStep = 'flow_editor'">
                  <ArrowLeft class="mr-2 size-4" />
                  Voltar
                </Button>
                <div class="flex flex-wrap gap-2">
                  <Button
                    v-if="canDelete"
                    variant="destructive"
                    :disabled="isDeleting"
                    @click="isDeleteDialogOpen = true"
                  >
                    {{ isDeleting ? "Excluindo..." : "Excluir draft" }}
                  </Button>
                  <Button variant="outline" :disabled="isReadonly || isSaving" @click="saveDraft('flow_review')">
                    {{ isSaving ? "Salvando..." : "Salvar" }}
                  </Button>
                  <Button :disabled="!campaign?.id || isValidating" @click="runValidation">
                    {{ isValidating ? "Validando..." : "Validar configuração" }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template v-else>
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
                v-for="(step, index) in activeSteps"
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
              :estimate="estimateForPanel"
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
            <Button :disabled="activeStepIndex === activeSteps.length - 1" @click="goToStep(activeStepIndex + 1)">Avançar</Button>
          </div>
        </div>
        </template>
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

    <AlertDialog :open="isFlowActivateDialogOpen" @update:open="isFlowActivateDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ativar jornada</AlertDialogTitle>
          <AlertDialogDescription>
            A partir de agora, cada evento do gatilho no projeto coloca o jogador no fluxo e as mensagens
            são enviadas de verdade. Depois de ativada, o fluxo fica somente leitura.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction :disabled="flowAction !== null" @click="runFlowAction('launch')">
            {{ flowAction === "launch" ? "Ativando..." : "Ativar" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog :open="isFlowCancelDialogOpen" @update:open="isFlowCancelDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar jornada</AlertDialogTitle>
          <AlertDialogDescription>
            Ninguém novo entra no fluxo e quem está no meio dele sai sem receber as próximas mensagens.
            Uma jornada encerrada não pode ser reativada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="flowAction !== null"
            @click="runFlowAction('cancel')"
          >
            {{ flowAction === "cancel" ? "Encerrando..." : "Encerrar jornada" }}
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
            <span v-if="launchEstimate">
              Estimativa: <strong>{{ launchEstimate.audience.estimated_recipients }}</strong> destinatário(s)<template v-if="form.channel === 'email'">
              / <strong>{{ launchEstimate.message.estimated_emails ?? launchEstimate.message.estimated_messages }}</strong> e-mail(s)</template><template v-else>,
              <strong>{{ launchEstimate.message.estimated_sms_segments }}</strong> segmento(s) de SMS</template><template v-if="launchEstimate.financial.estimated_cost !== null">,
              custo estimado de <strong>{{ formatCurrency(launchEstimate.financial.estimated_cost) }}</strong></template>.
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
import { ArrowLeft, Check, ChevronRight, Lightbulb, Pause, Play, Square } from "lucide-vue-next";
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
import CampaignTypeStep from "@/components/campaigns/CampaignTypeStep.vue";
import CampaignValidationList from "@/components/campaigns/CampaignValidationList.vue";
import CampaignWarmupStep from "@/components/campaigns/CampaignWarmupStep.vue";
import FlowEditorCanvas from "@/components/campaign-flow/FlowEditorCanvas.vue";
import FlowEstimatePanel from "@/components/campaign-flow/FlowEstimatePanel.vue";
import FlowSummaryPanel from "@/components/campaign-flow/FlowSummaryPanel.vue";
import {
  createCampaign,
  deleteCampaign,
  estimateCampaign,
  getCampaign,
  getFlowCatalog,
  getFlowStats,
  launchCampaign,
  updateCampaign,
  validateCampaign,
} from "@/services/campaigns";
import type {
  CampaignAnyEstimateResponse,
  CampaignConfigurationProgress,
  CampaignDetail,
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
  isBroadcastEstimate,
  isFlowEstimate,
} from "@/contracts/campaigns";
import {
  CAMPAIGN_RUN_STATUS_LABELS,
} from "@/contracts/campaignExecution";
import {
  createEmptyFlowConfig,
  createEmptyFlowDefinition,
  flattenCatalogNodeTypes,
  type CampaignFlowConfig,
  type FlowCatalogResponse,
  type FlowStatsResponse,
} from "@/contracts/campaignFlow";
import campaignExecutionService from "@/services/campaignExecution";
import { useCampaignExecutionStore } from "@/stores/campaignExecution";
import CampaignRunProgressPanel from "@/components/campaigns/CampaignRunProgressPanel.vue";
import CampaignWavesBatchesPanel from "@/components/campaigns/CampaignWavesBatchesPanel.vue";
import CampaignRecipientsPanel from "@/components/campaigns/CampaignRecipientsPanel.vue";

type StepKey =
  | "campaign_type"
  | "basic"
  | "audience"
  | "message"
  | "links"
  | "schedule"
  | "delivery_windows"
  | "recurrence_policy"
  | "warmup_policy"
  | "flow_editor"
  | "flow_review";

type WizardMode = "select" | "broadcast" | "flow";

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

const broadcastSteps: StepDefinition[] = [
  { key: "basic", label: "Dados básicos", sectionKeys: ["campaign", "channels"], progressKey: "channels" },
  { key: "audience", label: "Público", sectionKeys: ["audience", "campaign"], progressKey: "audience" },
  { key: "message", label: "Mensagem", sectionKeys: ["message"], progressKey: "message" },
  { key: "links", label: "Links", sectionKeys: ["links"], progressKey: "links" },
  { key: "schedule", label: "Agendamento", sectionKeys: ["schedule"], progressKey: "schedule" },
  { key: "delivery_windows", label: "Janelas", sectionKeys: ["delivery_windows"], progressKey: "delivery_windows" },
  { key: "recurrence_policy", label: "Recorrência", sectionKeys: ["recurrence_policy"] },
  { key: "warmup_policy", label: "Warmup", sectionKeys: ["warmup", "warmup_policy"], progressKey: "warmup" },
];

const flowSteps: StepDefinition[] = [
  { key: "campaign_type", label: "Tipo de campanha", sectionKeys: ["campaign", "basics"], progressKey: "basics" },
  { key: "flow_editor", label: "Editar fluxo", sectionKeys: ["flow", "flow_structure", "messages", "links"], progressKey: "flow" },
  { key: "flow_review", label: "Finalizar", sectionKeys: ["review"], progressKey: "review" },
];

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const campaignExecutionStore = useCampaignExecutionStore();

const campaign = ref<CampaignDetail | null>(null);
const configurationProgress = ref<CampaignConfigurationProgress | null>(null);
const campaignEstimate = ref<CampaignAnyEstimateResponse | null>(null);
const validationResult = ref<CampaignValidationResponse | null>(null);
const wizardMode = ref<WizardMode>(campaignIdFromRoute() ? "broadcast" : "select");
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
  campaign_type: false,
  basic: false,
  audience: false,
  message: false,
  links: false,
  schedule: false,
  delivery_windows: false,
  recurrence_policy: false,
  warmup_policy: false,
  flow_editor: false,
  flow_review: false,
});

type FlowLifecycleAction = "launch" | "pause" | "resume" | "cancel";

const FLOW_ACTION_TOASTS: Record<FlowLifecycleAction, string> = {
  launch: "Jornada ativada.",
  pause: "Jornada pausada.",
  resume: "Jornada retomada.",
  cancel: "Jornada encerrada.",
};

const FLOW_STATS_POLL_MS = 30000;

const flowStats = ref<FlowStatsResponse | null>(null);
const flowAction = ref<FlowLifecycleAction | null>(null);
const isFlowActivateDialogOpen = ref(false);
const isFlowCancelDialogOpen = ref(false);
let flowStatsInterval: number | null = null;

const flowCatalog = ref<FlowCatalogResponse | null>(null);
const isFlowCatalogLoading = ref(false);
const flowCatalogError = ref("");
let hasInitializedMode = false;
const stepAfterCreate = ref<StepKey | null>(null);

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

const campaignId = computed(() => campaignIdFromRoute());

function campaignIdFromRoute() {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

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

const activeProjectLabel = computed(
  () => workspaceStore.activeGroupProject?.name || "Nenhum projeto ativo",
);

const activeSteps = computed<StepDefinition[]>(() => (wizardMode.value === "flow" ? flowSteps : broadcastSteps));
const isFlowMode = computed(() => wizardMode.value === "flow");
const flowStepperIndex = computed(() => (wizardMode.value === "select" ? 0 : activeStepIndex.value));
const activeStepIndex = computed(() => activeSteps.value.findIndex((step) => step.key === activeStep.value));

function flowStepCircleClass(index: number) {
  if (index === flowStepperIndex.value) {
    return "border-primary bg-primary text-primary-foreground";
  }
  if (index < flowStepperIndex.value) {
    return "border-primary text-primary";
  }
  return "border-border text-muted-foreground";
}
const progressValue = computed(() => {
  if (configurationProgress.value && configurationProgress.value.total_steps > 0) {
    return (configurationProgress.value.completed_steps / configurationProgress.value.total_steps) * 100;
  }

  return ((activeStepIndex.value + 1) / activeSteps.value.length) * 100;
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
const canActivateFlow = computed(() =>
  Boolean(
    campaign.value?.id &&
      ["draft", "validation_failed", "validated", "prepared"].includes(campaign.value.status),
  ),
);

async function runFlowAction(action: FlowLifecycleAction) {
  const id = campaign.value?.id;
  if (!id || flowAction.value) return;

  flowAction.value = action;
  errorMessage.value = "";

  try {
    await campaignExecutionService[action](id);
    toast(FLOW_ACTION_TOASTS[action]);
    await loadCampaignContext(id);
  } catch (error) {
    errorMessage.value = extractHttpMessage(error, "Não foi possível alterar o estado da jornada.");
  } finally {
    flowAction.value = null;
    isFlowActivateDialogOpen.value = false;
    isFlowCancelDialogOpen.value = false;
  }
}

async function loadFlowStats() {
  const id = campaign.value?.id;
  if (!id || campaign.value?.type !== "flow" || campaign.value.status === "draft") {
    flowStats.value = null;
    return;
  }

  try {
    flowStats.value = await getFlowStats(id);
  } catch {
    // contagens são complementares: a tela segue sem elas
  }
}

function syncFlowStatsPolling() {
  if (flowStatsInterval) {
    window.clearInterval(flowStatsInterval);
    flowStatsInterval = null;
  }

  if (campaign.value?.type !== "flow" || campaign.value.status !== "running") return;

  flowStatsInterval = window.setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    loadFlowStats();
  }, FLOW_STATS_POLL_MS);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

const estimateForPanel = computed(() =>
  isBroadcastEstimate(campaignEstimate.value) ? campaignEstimate.value : null,
);
const flowEstimate = computed(() =>
  isFlowEstimate(campaignEstimate.value) ? campaignEstimate.value : null,
);
const launchEstimate = estimateForPanel;

const flowNodeTypes = computed(() => flattenCatalogNodeTypes(flowCatalog.value?.node_types));

watch(
  wizardMode,
  async (mode) => {
    if (mode === "flow" && !flowCatalog.value && !isFlowCatalogLoading.value) {
      await loadFlowCatalog();
    }
  },
  { immediate: true },
);

async function loadFlowCatalog() {
  isFlowCatalogLoading.value = true;
  flowCatalogError.value = "";

  try {
    flowCatalog.value = await getFlowCatalog();
  } catch (error) {
    flowCatalogError.value = extractHttpMessage(error, "Não foi possível carregar o catálogo do editor de fluxo.");
  } finally {
    isFlowCatalogLoading.value = false;
  }
}

function onTypeStepContinue() {
  if (wizardMode.value === "select") {
    wizardMode.value = form.type === "flow" ? "flow" : "broadcast";
    activeStep.value = form.type === "flow" ? "flow_editor" : "basic";
    return;
  }

  goToStep(activeStepIndex.value + 1);
}

function onTypeStepBack() {
  if (wizardMode.value === "select" || campaignId.value) {
    router.push({ name: "campaign-drafts.index" });
    return;
  }

  wizardMode.value = "select";
}

async function saveFlowAndContinue() {
  const wasCreate = !campaign.value?.id;
  if (wasCreate) {
    stepAfterCreate.value = "flow_review";
  }

  await saveDraft("flow_editor");

  if (errorMessage.value) {
    stepAfterCreate.value = null;
    return;
  }

  if (!wasCreate) {
    activeStep.value = "flow_review";
  }
}

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
  if (flowStatsInterval) {
    window.clearInterval(flowStatsInterval);
  }
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
    flow_config: null,
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

    const isFlow = detail.type === "flow";
    wizardMode.value = isFlow ? "flow" : "broadcast";
    if (!hasInitializedMode) {
      hasInitializedMode = true;
      const queryStep = typeof route.query.step === "string" ? route.query.step : null;
      const validKeys = (isFlow ? flowSteps : broadcastSteps).map((step) => step.key) as string[];
      activeStep.value = queryStep && validKeys.includes(queryStep)
        ? (queryStep as StepKey)
        : isFlow
          ? "campaign_type"
          : "basic";
    }

    isDirty.value = false;
    await Promise.all([runEstimate(id, false), loadFlowStats()]);
    syncFlowStatsPolling();
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
    flow_config: detail.flow_config
      ? {
          version: detail.flow_config.version ?? 1,
          definition: JSON.parse(JSON.stringify(detail.flow_config.definition || createEmptyFlowDefinition())) as CampaignFlowConfig["definition"],
          entry_audience: detail.flow_config.entry_audience ?? null,
        }
      : null,
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
      await router.replace({
        name: "campaign-drafts.edit",
        params: { id: detail.id },
        query: stepAfterCreate.value ? { step: stepAfterCreate.value } : undefined,
      });
      stepAfterCreate.value = null;
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

    const firstStep = activeSteps.value.find((step) => {
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

  const base = {
    project_id: activeProjectId.value,
    name: form.name,
    description: form.description,
    type: form.type,
    channel: form.channel,
    metadata: form.metadata,
  };

  if (form.type === "flow") {
    return {
      ...base,
      flow_config: form.flow_config || createEmptyFlowConfig(),
    };
  }

  return {
    ...base,
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
  const base = {
    name: form.name,
    description: form.description,
    type: form.type,
    channel: form.channel,
    metadata: form.metadata,
  };

  if (form.type === "flow") {
    return {
      ...base,
      flow_config: form.flow_config || createEmptyFlowConfig(),
    };
  }

  return {
    ...base,
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
  const progressKey = activeSteps.value.find((step) => step.key === stepKey)?.progressKey;
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
  return mergeMessages(activeSteps.value.find((step) => step.key === stepKey)?.sectionKeys || [], validationErrors.value);
}

function sectionWarnings(stepKey: StepKey) {
  return mergeMessages(activeSteps.value.find((step) => step.key === stepKey)?.sectionKeys || [], validationWarnings.value);
}

function mergeMessages(sectionKeys: string[], source: Record<string, { field: string; message: string }[]>) {
  return sectionKeys.flatMap((key) => source[key] || []);
}

function clearStepMessages(stepKey: StepKey) {
  const step = activeSteps.value.find((item) => item.key === stepKey);
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
  const step = activeSteps.value[index];
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
    const key = activeSteps.value.find((item) => item.key === step)?.sectionKeys[0] || "campaign";
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
