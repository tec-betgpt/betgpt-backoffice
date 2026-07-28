<template>
  <Card>
    <CardHeader class="pb-2">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>
            Lista paginada de recipients da execução (filtros + troubleshooting).
          </CardDescription>
        </div>

        <Button
          v-if="campaignId"
          variant="outline"
          size="sm"
          :disabled="store.loading.recipients"
          @click="refresh"
        >
          {{ store.loading.recipients ? "Atualizando..." : "Atualizar" }}
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <Alert v-if="errorMessage" variant="destructive">
        <AlertTitle>Não foi possível carregar recipients</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 md:grid-cols-6">
        <div class="space-y-2 md:col-span-2">
          <Label>Status</Label>
          <Select v-model="filterForm.status">
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
              <SelectItem
                v-for="option in CAMPAIGN_RUN_RECIPIENT_STATUS_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>Wave</Label>
          <Input v-model="filterForm.dispatch_wave_id" inputmode="numeric" placeholder="dispatch_wave_id" />
        </div>

        <div class="space-y-2">
          <Label>Batch</Label>
          <Input v-model="filterForm.broadcast_batch_id" inputmode="numeric" placeholder="broadcast_batch_id" />
        </div>

        <div class="space-y-2">
          <Label>Player</Label>
          <Input v-model="filterForm.player_id" placeholder="player_id" />
        </div>

        <div class="space-y-2">
          <Label>Telefone</Label>
          <Input v-model="filterForm.phone" placeholder="+55..." />
        </div>

        <div class="space-y-2">
          <Label>Por página</Label>
          <Select v-model="filterForm.per_page">
            <SelectTrigger>
              <SelectValue placeholder="50" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="value in CAMPAIGN_RUN_RECIPIENT_PER_PAGE_OPTIONS"
                :key="value"
                :value="String(value)"
              >
                {{ value }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button :disabled="!campaignId || store.loading.recipients" @click="applyFilters">
          Aplicar filtros
        </Button>
        <Button variant="outline" :disabled="!campaignId || store.loading.recipients" @click="clearFilters">
          Limpar
        </Button>
        <div class="ml-auto text-sm text-muted-foreground">
          {{ store.recipientsPagination.total }} resultado(s)
        </div>
      </div>

      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>player_id</TableHead>
              <TableHead>phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Tentativas</TableHead>
              <TableHead>Próx. retry</TableHead>
              <TableHead>Erro</TableHead>
              <TableHead>queued_at</TableHead>
              <TableHead>sent_at</TableHead>
              <TableHead>failed_at</TableHead>
              <TableHead>canceled_at</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="store.loading.recipients && store.recipients.length === 0">
              <TableCell colspan="11" class="h-24 text-center text-muted-foreground">
                Carregando recipients...
              </TableCell>
            </TableRow>
            <TableRow v-else-if="store.recipients.length === 0">
              <TableCell colspan="11" class="h-24 text-center text-muted-foreground">
                Nenhum recipient encontrado.
              </TableCell>
            </TableRow>

            <TableRow v-for="recipient in store.recipients" :key="recipient.id">
              <TableCell class="font-mono text-xs">{{ recipient.player_id || "—" }}</TableCell>
              <TableCell class="font-mono text-xs">{{ recipient.phone || "—" }}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {{ CAMPAIGN_RUN_RECIPIENT_STATUS_LABELS[recipient.status] || recipient.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">{{ recipient.attempts }}</TableCell>
              <TableCell>{{ formatDateTime(recipient.next_retry_at) }}</TableCell>
              <TableCell class="min-w-[220px]">
                <details v-if="recipient.last_error" class="text-xs">
                  <summary class="cursor-pointer text-destructive">Ver erro</summary>
                  <pre class="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs text-destructive">{{
                    recipient.last_error
                  }}</pre>
                </details>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </TableCell>
              <TableCell>{{ formatDateTime(recipient.queued_at) }}</TableCell>
              <TableCell>{{ formatDateTime(recipient.sent_at) }}</TableCell>
              <TableCell>{{ formatDateTime(recipient.failed_at) }}</TableCell>
              <TableCell>{{ formatDateTime(recipient.canceled_at) }}</TableCell>
              <TableCell class="text-right">
                <Button size="sm" variant="outline" @click="openDetails(recipient)">
                  Detalhes
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div v-if="store.recipientsPagination.last_page > 1" class="flex flex-wrap items-center justify-between gap-3">
        <Pagination
          v-model:page="pageModel"
          :total="store.recipientsPagination.total"
          :items-per-page="store.recipientsPagination.per_page"
          :sibling-count="1"
          show-edges
        >
          <PaginationList v-slot="{ items }" class="flex items-center gap-2">
            <PaginationFirst />
            <PaginationPrev />

            <template v-for="(item, index) in items" :key="index">
              <PaginationListItem
                v-if="item.type === 'page'"
                :value="item.value"
                as-child
              >
                <Button
                  class="min-h-9 min-w-9 p-2"
                  :variant="item.value === store.recipientsPagination.current_page ? 'default' : 'outline'"
                >
                  {{ item.value }}
                </Button>
              </PaginationListItem>
              <PaginationEllipsis v-else :index="index" />
            </template>

            <PaginationNext />
            <PaginationLast />
          </PaginationList>
        </Pagination>

        <div class="text-sm text-muted-foreground">
          Página {{ store.recipientsPagination.current_page }} de {{ store.recipientsPagination.last_page }}
        </div>
      </div>

      <Dialog v-model:open="isDetailsOpen">
        <DialogContent class="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do recipient</DialogTitle>
            <DialogDescription>
              Informações de auditoria (payload snapshot e metadata).
            </DialogDescription>
          </DialogHeader>

          <div v-if="selectedRecipient" class="space-y-4">
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">id</div>
                <div class="font-mono text-sm">{{ selectedRecipient.id }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">status</div>
                <div class="font-mono text-sm">{{ selectedRecipient.status }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">dispatch_wave_id</div>
                <div class="font-mono text-sm">{{ selectedRecipient.dispatch_wave_id ?? "—" }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">broadcast_batch_id</div>
                <div class="font-mono text-sm">{{ selectedRecipient.broadcast_batch_id ?? "—" }}</div>
              </div>
            </div>

            <div class="space-y-2">
              <div class="text-sm font-medium">payload_snapshot</div>
              <pre class="whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{{
                prettyJson(selectedRecipient.payload_snapshot)
              }}</pre>
            </div>

            <div class="space-y-2">
              <div class="text-sm font-medium">metadata</div>
              <pre class="whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{{
                prettyJson(selectedRecipient.metadata)
              }}</pre>
            </div>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CampaignRunRecipient, CampaignRunRecipientStatus, CampaignRunRecipientsFilters } from "@/contracts/campaignExecution";
import {
  CAMPAIGN_RUN_RECIPIENT_PER_PAGE_OPTIONS,
  CAMPAIGN_RUN_RECIPIENT_STATUS_LABELS,
  CAMPAIGN_RUN_RECIPIENT_STATUS_OPTIONS,
} from "@/contracts/campaignExecution";
import { extractExecutionErrorMessage, useCampaignExecutionStore } from "@/domains/campaign-execution/store";

const SELECT_ALL_VALUE = "__all__";

const props = defineProps<{
  campaignId: number | null;
  active?: boolean;
}>();

const store = useCampaignExecutionStore();
const errorMessage = ref("");
const hasLoadedOnce = ref(false);

const filterForm = reactive({
  status: SELECT_ALL_VALUE as string,
  dispatch_wave_id: "",
  broadcast_batch_id: "",
  player_id: "",
  phone: "",
  per_page: "50",
});

const pageModel = computed({
  get: () => store.recipientsPagination.current_page,
  set: async (page: number) => {
    if (!props.campaignId) return;
    try {
      errorMessage.value = "";
      await store.setRecipientPage(props.campaignId, page);
    } catch (error) {
      errorMessage.value = extractExecutionErrorMessage(error, "Não foi possível trocar a página.");
    }
  },
});

function hydrateFormFromStore() {
  const f = store.recipientFilters;
  filterForm.status = (f.status ?? SELECT_ALL_VALUE) as string;
  filterForm.dispatch_wave_id = f.dispatch_wave_id != null ? String(f.dispatch_wave_id) : "";
  filterForm.broadcast_batch_id = f.broadcast_batch_id != null ? String(f.broadcast_batch_id) : "";
  filterForm.player_id = f.player_id ?? "";
  filterForm.phone = f.phone ?? "";
  filterForm.per_page = String(f.per_page ?? 50);
}

function normalizeNumber(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function buildFiltersFromForm(): CampaignRunRecipientsFilters {
  const status =
    filterForm.status === SELECT_ALL_VALUE
      ? null
      : (filterForm.status as CampaignRunRecipientStatus);

  const perPage = clamp(Number(filterForm.per_page || 50) || 50, 1, 200);

  return {
    status,
    dispatch_wave_id: normalizeNumber(filterForm.dispatch_wave_id),
    broadcast_batch_id: normalizeNumber(filterForm.broadcast_batch_id),
    player_id: filterForm.player_id ? filterForm.player_id : null,
    phone: filterForm.phone ? filterForm.phone : null,
    per_page: perPage,
  };
}

async function refresh() {
  if (!props.campaignId) return;
  try {
    errorMessage.value = "";
    await store.fetchRunRecipients(props.campaignId);
  } catch (error) {
    errorMessage.value = extractExecutionErrorMessage(error, "Não foi possível carregar recipients.");
  }
}

async function applyFilters() {
  if (!props.campaignId) return;
  try {
    errorMessage.value = "";
    await store.setRecipientFilters(props.campaignId, buildFiltersFromForm());
  } catch (error) {
    errorMessage.value = extractExecutionErrorMessage(error, "Não foi possível aplicar os filtros.");
  }
}

async function clearFilters() {
  filterForm.status = SELECT_ALL_VALUE;
  filterForm.dispatch_wave_id = "";
  filterForm.broadcast_batch_id = "";
  filterForm.player_id = "";
  filterForm.phone = "";
  filterForm.per_page = "50";

  await applyFilters();
}

watch(
  () => props.campaignId,
  async () => {
    hasLoadedOnce.value = false;
    hydrateFormFromStore();
  },
  { immediate: true },
);

watch(
  [() => props.active, () => props.campaignId, () => store.hasRun],
  async ([active, campaignId, hasRun]) => {
    if (!active) return;
    if (!campaignId) return;
    if (!hasRun) return;
    if (hasLoadedOnce.value) return;
    hasLoadedOnce.value = true;
    await refresh();
  },
  { immediate: true },
);

onMounted(() => {
  hydrateFormFromStore();
});

const isDetailsOpen = ref(false);
const selectedRecipient = ref<CampaignRunRecipient | null>(null);

function openDetails(recipient: CampaignRunRecipient) {
  selectedRecipient.value = recipient;
  isDetailsOpen.value = true;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function prettyJson(value: unknown) {
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
</script>

