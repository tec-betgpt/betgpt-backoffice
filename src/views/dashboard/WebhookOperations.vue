<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Operação de Webhooks</h2>
        <p class="text-muted-foreground">
          Subscriptions, monitoramento de entrada e exploração de deliveries, attempts e DLQ.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Badge v-if="lastUpdatedAt" variant="outline">
          Atualizado {{ formatDateTime(lastUpdatedAt) }}
        </Badge>
        <Button variant="outline" size="sm" :disabled="isRefreshing" @click="refreshAll">
          <RefreshCw :class="['mr-2 h-4 w-4', isRefreshing ? 'animate-spin' : '']" />
          Atualizar
        </Button>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Falha na operação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList>
        <TabsTrigger value="subscriptions">
          <Webhook class="mr-2 h-4 w-4" />
          Subscriptions
        </TabsTrigger>
        <TabsTrigger value="outgoing">
          <Send class="mr-2 h-4 w-4" />
          Saída / DLQ
        </TabsTrigger>
        <TabsTrigger value="incoming">
          <Download class="mr-2 h-4 w-4" />
          Entrada
        </TabsTrigger>
      </TabsList>

      <TabsContent value="subscriptions" class="mt-4 space-y-4">
        <div v-if="subscriptionsLoading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton v-for="item in 3" :key="item" class="h-44 w-full" />
        </div>

        <div v-else-if="subscriptions.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card v-for="webhook in subscriptions" :key="webhook.id">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">{{ webhook.name }}</CardTitle>
              <Webhook class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent class="space-y-3">
              <p class="text-sm text-muted-foreground">{{ webhook.description }}</p>

              <div>
                <p class="text-xs font-semibold uppercase tracking-tight text-muted-foreground">URL</p>
                <p class="mt-0.5 truncate text-sm" :title="webhook.webhook?.webhook_url || ''">
                  {{ webhook.webhook?.webhook_url || "Não configurada" }}
                </p>
              </div>

              <div>
                <p class="text-xs font-semibold uppercase tracking-tight text-muted-foreground">
                  Eventos inscritos
                </p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <Badge v-if="!subscribedTypes(webhook).length" variant="outline">Nenhum</Badge>
                  <Badge v-for="eventType in subscribedTypes(webhook)" :key="eventType" variant="secondary">
                    {{ eventType }}
                  </Badge>
                </div>
              </div>

              <div class="flex justify-end pt-1">
                <Button variant="outline" size="sm" @click="openSubscriptionDialog(webhook)">
                  <Settings2 class="mr-2 h-3.5 w-3.5" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl"
        >
          <p class="text-muted-foreground">Nenhum webhook disponível para configuração neste projeto.</p>
        </div>
      </TabsContent>

      <TabsContent value="outgoing" class="mt-4 space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <div class="flex flex-col gap-2">
              <Label class="text-xs">Fila</Label>
              <Select v-model="outboxFilters.queue" @update:model-value="fetchOutbox(1)">
                <SelectTrigger class="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="dlq">Somente DLQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-2">
              <Label class="text-xs">Tipo de evento</Label>
              <Select v-model="outboxFilters.eventType" @update:model-value="fetchOutbox(1)">
                <SelectTrigger class="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem v-for="eventType in EVENT_TYPES" :key="eventType" :value="eventType">
                    {{ eventType }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" @click="clearOutboxFilters">
              Limpar filtros
            </Button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            :disabled="selectedOutboxIds.length === 0 || outboxStore.replaying"
            @click="replaySelected"
          >
            <RefreshCw :class="['mr-2 h-3.5 w-3.5', outboxStore.replaying ? 'animate-spin' : '']" />
            Replay ({{ selectedOutboxIds.length }})
          </Button>
        </div>

        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle>Outbox</CardTitle>
              <Badge variant="outline">{{ outbox?.total ?? 0 }} linhas</Badge>
            </div>
          </CardHeader>
          <CardContent class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-10">
                    <Checkbox
                      :checked="allOutboxSelected"
                      @update:checked="toggleSelectAll"
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Último erro</TableHead>
                  <TableHead class="text-right">Processado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="outboxLoading && !outbox">
                  <TableCell colspan="9" class="py-8 text-center text-muted-foreground">
                    Carregando outbox...
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="outboxRows.length === 0">
                  <TableCell colspan="9" class="py-8 text-center text-muted-foreground">
                    Nenhuma linha no outbox para os filtros selecionados.
                  </TableCell>
                </TableRow>
                <TableRow v-for="row in outboxRows" :key="row.id" :class="row.dlq ? 'bg-destructive/5' : ''">
                  <TableCell>
                    <Checkbox
                      :checked="selectedOutboxIds.includes(row.id)"
                      @update:checked="toggleSelect(row.id)"
                    />
                  </TableCell>
                  <TableCell class="font-medium">#{{ row.id }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ row.event_type }}</Badge>
                    <div class="mt-0.5 font-mono text-xs text-muted-foreground">{{ shortId(row.event_id) }}</div>
                  </TableCell>
                  <TableCell>{{ row.project_webhook_id ?? "—" }}</TableCell>
                  <TableCell>
                    <span :class="row.attempts > 1 ? 'font-medium text-destructive' : ''">
                      {{ row.attempts }}
                    </span>
                  </TableCell>
                  <TableCell class="max-w-[220px] truncate" :title="row.last_error || ''">
                    {{ row.last_error || "—" }}
                  </TableCell>
                  <TableCell class="text-right text-nowrap">
                    {{ formatNullableDateTime(row.processed_at) }}
                  </TableCell>
                  <TableCell>
                    <Badge v-if="row.dlq" variant="destructive">DLQ</Badge>
                    <Badge v-else-if="row.processed_at" variant="secondary">Processado</Badge>
                    <Badge v-else variant="outline">Pendente</Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      :disabled="outboxStore.replaying"
                      @click="replaySingle(row.id)"
                    >
                      <RefreshCw class="mr-1.5 h-3.5 w-3.5" />
                      Replay
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div class="mt-4">
              <CustomPagination
                v-if="outbox"
                :pages="{ current: outbox.current_page, total: outbox.total, last: outbox.last_page }"
                :select-page="fetchOutbox"
                :per-pages="50"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle>Logs de entrega</CardTitle>
              <Badge variant="outline">{{ deliveryLogs?.total ?? 0 }} registros</Badge>
            </div>
          </CardHeader>
          <CardContent class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead class="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="logsLoading && !deliveryLogs">
                  <TableCell colspan="6" class="py-8 text-center text-muted-foreground">
                    Carregando logs...
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="deliveryLogRows.length === 0">
                  <TableCell colspan="6" class="py-8 text-center text-muted-foreground">
                    Nenhum log de entrega registrado.
                  </TableCell>
                </TableRow>
                <TableRow v-for="row in deliveryLogRows" :key="row.id">
                  <TableCell class="font-medium">#{{ row.id }}</TableCell>
                  <TableCell>{{ row.event_type || "—" }}</TableCell>
                  <TableCell>
                    <Badge :variant="row.success ? 'default' : 'destructive'">
                      {{ row.success ? "Sucesso" : "Falha" }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ row.response_status ?? "—" }}</TableCell>
                  <TableCell class="max-w-[260px] truncate" :title="row.reason || ''">
                    {{ row.reason || "—" }}
                  </TableCell>
                  <TableCell class="text-right text-nowrap">
                    {{ formatDateTime(row.created_at) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div class="mt-4">
              <CustomPagination
                v-if="deliveryLogs"
                :pages="{ current: deliveryLogs.current_page, total: deliveryLogs.total, last: deliveryLogs.last_page }"
                :select-page="fetchDeliveryLogs"
                :per-pages="50"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="incoming" class="mt-4 space-y-4">
        <div class="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Total de postbacks</CardTitle>
              <Inbox class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ formatInteger(incoming?.summary.total) }}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Pendentes</CardTitle>
              <Hourglass class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ formatInteger(incoming?.summary.pending) }}</div>
            </CardContent>
          </Card>
          <Card :class="incomingErrorCount > 0 ? 'border-destructive bg-destructive/5' : ''">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Com erro</CardTitle>
              <AlertTriangle class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div :class="['text-2xl font-bold', incomingErrorCount > 0 ? 'text-destructive' : '']">
                {{ formatInteger(incomingErrorCount) }}
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <div class="flex flex-col gap-2">
              <Label class="text-xs">Tipo</Label>
              <Select v-model="incomingFilters.type" @update:model-value="fetchIncoming(1)">
                <SelectTrigger class="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem v-for="type in incomingTypes" :key="type" :value="type">
                    {{ type }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-2">
              <Label class="text-xs">Status</Label>
              <Select v-model="incomingFilters.status" @update:model-value="fetchIncoming(1)">
                <SelectTrigger class="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="processed">Processado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="error">Com erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" @click="clearIncomingFilters">
              Limpar filtros
            </Button>
          </div>
        </div>

        <Card>
          <CardContent class="overflow-x-auto py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead class="text-right">Processado em</TableHead>
                  <TableHead class="text-right">Recebido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="incomingLoading && !incoming">
                  <TableCell colspan="7" class="py-8 text-center text-muted-foreground">
                    Carregando postbacks...
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="incomingLogRows.length === 0">
                  <TableCell colspan="7" class="py-8 text-center text-muted-foreground">
                    Nenhum postback para os filtros selecionados.
                  </TableCell>
                </TableRow>
                <TableRow v-for="row in incomingLogRows" :key="row.id">
                  <TableCell class="font-medium">#{{ row.id }}</TableCell>
                  <TableCell>{{ row.project?.name ?? `#${row.project_id}` }}</TableCell>
                  <TableCell><Badge variant="outline">{{ row.type }}</Badge></TableCell>
                  <TableCell>
                    <Badge :variant="row.status === 'processed' ? 'default' : row.error ? 'destructive' : 'secondary'">
                      {{ row.status }}
                    </Badge>
                  </TableCell>
                  <TableCell class="max-w-[240px] truncate" :title="row.error || ''">
                    {{ row.error || "—" }}
                  </TableCell>
                  <TableCell class="text-right text-nowrap">
                    {{ formatNullableDateTime(row.processed_at) }}
                  </TableCell>
                  <TableCell class="text-right text-nowrap">
                    {{ formatDateTime(row.created_at) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div class="mt-4">
              <CustomPagination
                v-if="incoming"
                :pages="{ current: incoming.logs.current_page, total: incoming.logs.total, last: incoming.logs.last_page }"
                :select-page="fetchIncoming"
                :per-pages="50"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <Dialog :open="subscriptionDialogOpen" @update:open="subscriptionDialogOpen = $event">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar {{ selectedSubscription?.name }}</DialogTitle>
          <DialogDescription>
            URL de destino e eventos canônicos inscritos neste webhook.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-2">
            <Label for="webhook-url">URL</Label>
            <Input
              id="webhook-url"
              v-model="editingUrl"
              placeholder="https://sua-url-de-webhook.com"
            />
          </div>

          <div class="space-y-2">
            <Label>Eventos inscritos</Label>
            <div class="grid max-h-56 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
              <label
                v-for="eventType in EVENT_TYPES"
                :key="eventType"
                class="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  :checked="editingEventTypes.includes(eventType)"
                  @update:checked="toggleEventType(eventType)"
                />
                <span>{{ eventType }}</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="subscriptionDialogOpen = false">Cancelar</Button>
          <Button :disabled="savingSubscription" @click="saveSubscription">
            <Loader2 v-if="savingSubscription" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  AlertTriangle,
  Download,
  Hourglass,
  Inbox,
  Loader2,
  RefreshCw,
  Send,
  Settings2,
  Webhook,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import WebhooksService from "@/services/webhooks";
import { EVENT_TYPES } from "@/contracts/observability";
import { useWebhooksStore } from "@/stores/webhooks";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";

interface ProjectWebhookItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  webhook: {
    webhook_url: string | null;
    event_types: string[] | null;
  } | null;
}

const outboxStore = useWebhooksStore();
const workspaceStore = useWorkspaceStore();

const activeTab = ref("subscriptions");
const errorMessage = ref("");
const lastUpdatedAt = ref<Date | null>(null);
const isRefreshing = ref(false);

const subscriptions = ref<ProjectWebhookItem[]>([]);
const subscriptionsLoading = ref(false);
const subscriptionDialogOpen = ref(false);
const selectedSubscription = ref<ProjectWebhookItem | null>(null);
const editingUrl = ref("");
const editingEventTypes = ref<string[]>([]);
const savingSubscription = ref(false);

const outboxFilters = ref({ queue: "all", eventType: "all" });
const selectedOutboxIds = ref<number[]>([]);

const incomingFilters = ref({ type: "all", status: "all" });

const pollTimer = ref<number | null>(null);

const projectId = computed(() => Number(workspaceStore.activeGroupProject?.project_id ?? 0));

const outbox = computed(() => outboxStore.outbox);
const outboxRows = computed(() => outbox.value?.data ?? []);
const outboxLoading = computed(() => outboxStore.loading && !outbox.value);

const deliveryLogs = computed(() => outboxStore.logs);
const deliveryLogRows = computed(() => deliveryLogs.value?.data ?? []);
const logsLoading = computed(() => outboxStore.loading && !deliveryLogs.value);

const incoming = computed(() => outboxStore.incoming);
const incomingLogRows = computed(() => incoming.value?.logs.data ?? []);
const incomingLoading = computed(() => outboxStore.loading && !incoming.value);
const incomingErrorCount = computed(() => incoming.value?.summary.errors ?? 0);

const allOutboxSelected = computed(() => {
  const rows = outboxRows.value;
  return rows.length > 0 && rows.every((row) => selectedOutboxIds.value.includes(row.id));
});

const incomingTypes = computed(() => {
  const types = new Set<string>();
  incomingLogRows.value.forEach((row) => types.add(row.type));
  return Array.from(types);
});

function subscribedTypes(webhook: ProjectWebhookItem) {
  const types = webhook.webhook?.event_types;
  if (Array.isArray(types) && types.length) return types;
  return EVENT_TYPES.slice();
}

async function fetchSubscriptions() {
  subscriptionsLoading.value = true;

  try {
    const response = await WebhooksService.index(projectId.value);
    const raw = (response?.data ?? []) as unknown[];
    subscriptions.value = raw.map((item) => {
      const webhook = item as ProjectWebhookItem;
      return {
        ...webhook,
        webhook: webhook.webhook
          ? {
              webhook_url: webhook.webhook.webhook_url,
              event_types: Array.isArray(webhook.webhook.event_types)
                ? webhook.webhook.event_types
                : null,
            }
          : null,
      };
    });
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    subscriptionsLoading.value = false;
  }
}

function fetchOutbox(page: number) {
  if (!projectId.value) return Promise.resolve();

  const params: Record<string, string | number | boolean> = { page };
  if (outboxFilters.value.queue === "pending") params.pending = true;
  if (outboxFilters.value.queue === "dlq") params.dlq = true;
  if (outboxFilters.value.eventType !== "all") params.event_type = outboxFilters.value.eventType;

  return outboxStore.fetchOutbox(projectId.value, params).then(() => {
    selectedOutboxIds.value = [];
  });
}

function fetchDeliveryLogs(page: number) {
  if (!projectId.value) return Promise.resolve();

  const params: Record<string, string | number | boolean> = { page };
  if (outboxFilters.value.eventType !== "all") params.event_type = outboxFilters.value.eventType;

  return outboxStore.fetchDeliveryLogs(projectId.value, params);
}

function fetchIncoming(page: number) {
  if (!projectId.value) return Promise.resolve();

  const params: Record<string, string | number | boolean> = { page };
  if (incomingFilters.value.type !== "all") params.type = incomingFilters.value.type;
  if (incomingFilters.value.status === "processed") params.status = "processed";
  if (incomingFilters.value.status === "error") params.failed = true;

  return outboxStore.fetchIncoming(projectId.value, params);
}

function clearOutboxFilters() {
  outboxFilters.value = { queue: "all", eventType: "all" };
  fetchOutbox(1);
  fetchDeliveryLogs(1);
}

function clearIncomingFilters() {
  incomingFilters.value = { type: "all", status: "all" };
  fetchIncoming(1);
}

function toggleSelect(id: number) {
  if (selectedOutboxIds.value.includes(id)) {
    selectedOutboxIds.value = selectedOutboxIds.value.filter((value) => value !== id);
  } else {
    selectedOutboxIds.value = [...selectedOutboxIds.value, id];
  }
}

function toggleSelectAll(checked: boolean | "indeterminate") {
  if (checked === true) {
    selectedOutboxIds.value = outboxRows.value.map((row) => row.id);
  } else {
    selectedOutboxIds.value = [];
  }
}

async function replaySingle(id: number) {
  await doReplay([id]);
}

async function replaySelected() {
  await doReplay(selectedOutboxIds.value);
}

async function doReplay(ids: number[]) {
  if (!ids.length) return;

  try {
    const response = await outboxStore.replayOutbox(ids);
    toast("Replay", { description: response.message });
    selectedOutboxIds.value = [];
    await Promise.all([fetchOutbox(1), fetchDeliveryLogs(1)]);
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  }
}

function openSubscriptionDialog(webhook: ProjectWebhookItem) {
  selectedSubscription.value = webhook;
  editingUrl.value = webhook.webhook?.webhook_url ?? "";
  editingEventTypes.value = [...subscribedTypes(webhook)];
  subscriptionDialogOpen.value = true;
}

function toggleEventType(eventType: string) {
  if (editingEventTypes.value.includes(eventType)) {
    editingEventTypes.value = editingEventTypes.value.filter((value) => value !== eventType);
  } else {
    editingEventTypes.value = [...editingEventTypes.value, eventType];
  }
}

async function saveSubscription() {
  if (!selectedSubscription.value) return;

  savingSubscription.value = true;
  errorMessage.value = "";

  try {
    await WebhooksService.update(projectId.value, {
      webhook_id: selectedSubscription.value.id,
      webhook_url: editingUrl.value,
      event_types: editingEventTypes.value,
    });

    toast("Sucesso", { description: `Webhook ${selectedSubscription.value.name} atualizado com sucesso.` });
    subscriptionDialogOpen.value = false;
    await fetchSubscriptions();
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    savingSubscription.value = false;
  }
}

function refreshAll() {
  isRefreshing.value = true;
  errorMessage.value = "";
  lastUpdatedAt.value = new Date();

  Promise.allSettled([
    fetchSubscriptions(),
    fetchOutbox(1),
    fetchDeliveryLogs(1),
    fetchIncoming(1),
  ]).finally(() => {
    isRefreshing.value = false;
  });
}

function extractErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    if (response?.status === 403) return "Você não tem acesso a este projeto/workspace.";
    return response?.data?.message ?? "Não foi possível concluir a operação.";
  }
  return "Não foi possível concluir a operação.";
}

function formatInteger(value: number | undefined | null) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR").format(Number.isFinite(number) ? number : 0);
}

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatNullableDateTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : "—";
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 12)}…` : value;
}

onMounted(() => {
  refreshAll();
  pollTimer.value = window.setInterval(() => {
    fetchOutbox(1);
    fetchIncoming(1);
  }, 30_000);
});

onBeforeUnmount(() => {
  if (pollTimer.value) {
    window.clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
});

useScreenContext(
  "Operação de webhooks - subscriptions, saída/DLQ e entrada",
  () => ({
    project_id: projectId.value || "",
    active_tab: activeTab.value,
    outbox_total: outbox.value?.total ?? "",
    outbox_dlq: outbox.value?.data.filter((row) => row.dlq).length ?? "",
    incoming_errors: incoming.value?.summary.errors ?? "",
    last_updated_at: lastUpdatedAt.value?.toISOString() ?? "",
  }),
  "/v1/webhooks/admin",
);
</script>
