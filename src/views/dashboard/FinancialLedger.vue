<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 pb-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Extrato do ledger</h2>
        <p class="text-muted-foreground">
          Trilha auditável por linha do razão financeiro, com origem até o evento operacional.
        </p>
      </div>
      <div class="flex items-center justify-start w-full"></div>
    </div>

    <Card>
      <CardHeader class="space-y-4">
        <div>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre por campanha, projeto, tipo de entrada, origem e período.</CardDescription>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div class="space-y-1">
            <Label>Campanha</Label>
            <Input
              v-model="filters.campaign_id"
              type="number"
              min="1"
              placeholder="ID da campanha"
              @change="applyFilters"
            />
          </div>
          <div class="space-y-1">
            <Label>Tipo de entrada</Label>
            <Select v-model="filters.entry_type">
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem v-for="option in LEDGER_ENTRY_TYPE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1">
            <Label>Origem</Label>
            <Select v-model="filters.source_type">
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem v-for="option in LEDGER_SOURCE_TYPE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1">
            <Label>Dispatch</Label>
            <Input
              v-model="filters.campaign_dispatch_id"
              type="number"
              min="1"
              placeholder="ID do dispatch"
              @change="applyFilters"
            />
          </div>
          <div class="flex items-end gap-2">
            <div class="space-y-1">
              <Label>De</Label>
              <Input v-model="filters.date_from" type="date" @change="applyFilters" />
            </div>
            <div class="space-y-1">
              <Label>Até</Label>
              <Input v-model="filters.date_to" type="date" @change="applyFilters" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert v-if="errorMessage" variant="destructive">
          <AlertTitle>Não foi possível carregar o extrato</AlertTitle>
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <div class="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-10"></TableHead>
                <TableHead>Data/hora</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Dispatch</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Tipo de entrada</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead class="text-right">Quantidade</TableHead>
                <TableHead class="text-right">Valor</TableHead>
                <TableHead>Moeda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading && entries.length === 0">
                <TableCell colspan="10" class="py-8 text-center text-muted-foreground">
                  Carregando extrato...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="entries.length === 0">
                <TableCell colspan="10" class="py-8 text-center text-muted-foreground">
                  Nenhum movimento para os filtros selecionados.
                </TableCell>
              </TableRow>
              <template v-for="entry in entries" :key="entry.id">
                <TableRow class="cursor-pointer" @click="toggleExpanded(entry.id)">
                  <TableCell>
                    <ChevronRight
                      class="h-4 w-4 transition-transform"
                      :class="expandedIds.has(entry.id) ? 'rotate-90' : ''"
                    />
                  </TableCell>
                  <TableCell>{{ formatDateTime(entry.occurred_at) }}</TableCell>
                  <TableCell>
                    <button
                      v-if="entry.campaign"
                      class="text-left font-medium text-primary hover:underline"
                      @click.stop="router.push({ name: 'campaign-drafts.show', params: { id: entry.campaign.id } })"
                    >
                      {{ entry.campaign.name }}
                    </button>
                    <span v-else>—</span>
                  </TableCell>
                  <TableCell>
                    <span v-if="dispatchIdOf(entry)">#{{ dispatchIdOf(entry) }}</span>
                    <span v-else>—</span>
                  </TableCell>
                  <TableCell>
                    <template v-if="entry.billable_resource">
                      {{ entry.billable_resource.code }} ({{ entry.billable_resource.channel }})
                    </template>
                    <span v-else>desconhecido</span>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="entryTypeVariant(entry.entry_type)">
                      {{ LEDGER_ENTRY_TYPE_LABELS[entry.entry_type] }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ LEDGER_SOURCE_TYPE_LABELS[entry.source_type] }}</TableCell>
                  <TableCell class="text-right">{{ formatNumber(entry.quantity) }} {{ entry.unit }}</TableCell>
                  <TableCell class="text-right">
                    <span :class="entry.signed_amount_cents !== null && entry.signed_amount_cents < 0 ? 'text-destructive' : ''">
                      {{ formatSignedCents(entry.signed_amount_cents, entry.currency) }}
                    </span>
                  </TableCell>
                  <TableCell>{{ entry.currency }}</TableCell>
                </TableRow>
                <TableRow v-if="expandedIds.has(entry.id)" class="bg-muted/30">
                  <TableCell></TableCell>
                  <TableCell colspan="9">
                    <div class="space-y-2 py-2 text-sm">
                      <div v-if="entry.description" class="text-muted-foreground">{{ entry.description }}</div>
                      <div class="flex flex-wrap gap-x-6 gap-y-1">
                        <span><span class="text-muted-foreground">source_id:</span> {{ entry.source_id ?? "—" }}</span>
                        <span>
                          <span class="text-muted-foreground">idempotency_key:</span>
                          {{ (entry.metadata as Record<string, unknown> | null)?.idempotency_key ?? "—" }}
                        </span>
                        <span v-if="entry.project_id">
                          <span class="text-muted-foreground">project_id:</span> {{ entry.project_id }}
                        </span>
                        <span>
                          <span class="text-muted-foreground">supplier:</span>
                          {{ formatCents(entry.supplier_amount_cents, entry.currency) }}
                        </span>
                        <span>
                          <span class="text-muted-foreground">margem:</span>
                          {{ formatSignedCents(marginOf(entry), entry.currency) }}
                        </span>
                      </div>
                      <div v-if="entry.metadata && Object.keys(entry.metadata).length" class="rounded-md border p-3">
                        <div class="mb-1 text-xs font-medium uppercase text-muted-foreground">Metadata</div>
                        <div class="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                          <div v-for="(value, key) in entry.metadata" :key="key" class="break-words">
                            <span class="text-muted-foreground">{{ key }}:</span>
                            <span class="font-mono text-xs">{{ stringifyValue(value) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>

        <CustomPagination
          :select-page="applyFilters"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="(value) => { perPage = value }"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronRight } from "lucide-vue-next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import {
  LEDGER_ENTRY_TYPE_LABELS,
  LEDGER_ENTRY_TYPE_OPTIONS,
  LEDGER_SOURCE_TYPE_LABELS,
  LEDGER_SOURCE_TYPE_OPTIONS,
  formatCents,
  formatSignedCents,
  type LedgerEntry,
  type LedgerEntryType,
  type LedgerListResponse,
  type LedgerParams,
  type LedgerSourceType,
} from "@/contracts/financialLedger";
import { getLedger } from "@/services/financialLedger";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const entries = ref<LedgerEntry[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const expandedIds = ref<Set<number>>(new Set());
const perPage = ref("25");

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

const filters = reactive<{
  campaign_id: string;
  campaign_dispatch_id: string;
  entry_type: string;
  source_type: string;
  date_from: string;
  date_to: string;
}>({
  campaign_id: String(route.query.campaign_id ?? ""),
  campaign_dispatch_id: "",
  entry_type: "all",
  source_type: "all",
  date_from: "",
  date_to: "",
});

function buildParams(page = pages.value.current): LedgerParams {
  const filterId = workspaceStore.activeGroupProject?.id ?? "";
  return {
    filter_id: filterId || "all",
    page,
    per_page: Number(perPage.value) || 25,
    campaign_id: filters.campaign_id ? Number(filters.campaign_id) : null,
    campaign_dispatch_id: filters.campaign_dispatch_id ? Number(filters.campaign_dispatch_id) : null,
    entry_type: filters.entry_type === "all" ? null : (filters.entry_type as LedgerEntryType | null),
    source_type: filters.source_type === "all" ? null : (filters.source_type as LedgerSourceType | null),
    date_from: filters.date_from || null,
    date_to: filters.date_to || null,
  };
}

async function applyFilters(page = 1) {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response: LedgerListResponse = await getLedger(buildParams(page));
    entries.value = response.data;
    pages.value = {
      current: response.current_page,
      total: response.total,
      last: response.last_page,
    };
  } catch (error) {
    entries.value = [];
    errorMessage.value = getHttpMessage(
      error,
      "Não foi possível carregar o extrato. Você tem acesso a este projeto/workspace?",
    );
  } finally {
    loading.value = false;
  }
}

function toggleExpanded(id: number) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
}

function dispatchIdOf(entry: LedgerEntry) {
  const metadata = entry.metadata as Record<string, unknown> | null;
  const value = metadata?.campaign_dispatch_id;
  return typeof value === "number" ? value : null;
}

function marginOf(entry: LedgerEntry) {
  if (entry.signed_amount_cents === null || entry.supplier_amount_cents === null) return null;
  return entry.signed_amount_cents - entry.supplier_amount_cents;
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function entryTypeVariant(type: LedgerEntryType) {
  if (type === "release") return "outline";
  if (type === "adjustment") return "secondary";
  if (type === "reservation") return "default";
  return "secondary";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric" }).format(new Date(value));
}

function getHttpMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

onMounted(() => applyFilters(1));

watch(perPage, () => applyFilters(1));

watch(() => filters.entry_type, () => applyFilters(1));

watch(() => filters.source_type, () => applyFilters(1));

watch(
  () => workspaceStore.activeGroupProject?.id,
  () => applyFilters(1),
);

useScreenContext(
  "Extrato do ledger - Trilha auditável por linha do razão financeiro",
  () => ({
    ...buildParams(),
    total: pages.value.total,
    last_page: pages.value.last,
  }),
  "/v1/financial/ledger",
);
</script>