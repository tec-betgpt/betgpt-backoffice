<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 pb-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Uso de recursos</h2>
        <p class="text-muted-foreground">
          Consumo agregado por recurso, provider, campanha e período a partir do ledger financeiro.
        </p>
      </div>
      <div class="flex items-center justify-start w-full"></div>
    </div>

    <Card>
      <CardHeader class="space-y-4">
        <div>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre o consumo pelo escopo de projetos e período desejado.</CardDescription>
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
            <Label>Canal</Label>
            <Select v-model="filters.channel">
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1">
            <Label>Recurso (billable)</Label>
            <Input v-model="filters.billable_resource" placeholder="ex.: sms_segment" @change="applyFilters" />
          </div>
          <div class="space-y-1">
            <Label>Provider</Label>
            <Input v-model="filters.provider" placeholder="ex.: sms_funnel" @change="applyFilters" />
          </div>
          <div class="space-y-1">
            <Label>Supplier</Label>
            <Input v-model="filters.supplier" placeholder="Nome do supplier" @change="applyFilters" />
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
      <CardContent class="space-y-6">
        <div v-if="campaignIdFromRoute" class="flex flex-wrap items-center gap-2 rounded-md border p-3">
          <span class="text-sm text-muted-foreground">Filtrado pela campanha #{{ campaignIdFromRoute }}</span>
          <Button size="sm" variant="outline" @click="router.push({ name: 'campaign-drafts.show', params: { id: campaignIdFromRoute } })">
            Abrir campanha
          </Button>
          <Button size="sm" variant="ghost" @click="clearCampaignFilter">Limpar filtro de campanha</Button>
        </div>

        <Alert v-if="errorMessage" variant="destructive">
          <AlertTitle>Não foi possível carregar o uso de recursos</AlertTitle>
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <template v-if="usage">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatBlock label="Quantidade consumida" :value="formatNumber(usage.totals.quantity)" />
            <StatBlock label="Valor ao cliente" :value="formatCents(usage.totals.customer_amount_cents)" />
            <StatBlock label="Custo supplier" :value="formatCents(usage.totals.supplier_amount_cents)" />
            <StatBlock label="Margem" :value="formatCents(usage.totals.margin_amount_cents)" />
          </div>

          <section class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-medium">Por recurso</h4>
              <span v-if="usage.timestamps.last_event_at" class="text-xs text-muted-foreground">
                Último evento: {{ formatDateTime(usage.timestamps.last_event_at) }}
              </span>
            </div>
            <div v-if="usage.by_resource.length" class="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead class="text-right">Quantidade</TableHead>
                    <TableHead class="text-right">Valor ao cliente</TableHead>
                    <TableHead class="text-right">Custo supplier</TableHead>
                    <TableHead class="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in usage.by_resource" :key="row.billable_resource">
                    <TableCell>{{ row.billable_resource || "desconhecido" }}</TableCell>
                    <TableCell>{{ row.channel || "—" }}</TableCell>
                    <TableCell class="text-right">{{ formatNumber(row.quantity) }}</TableCell>
                    <TableCell class="text-right">{{ formatCents(row.customer_amount_cents) }}</TableCell>
                    <TableCell class="text-right">{{ formatCents(row.supplier_amount_cents) }}</TableCell>
                    <TableCell class="text-right">{{ formatCents(row.margin_amount_cents) }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p v-else class="text-sm text-muted-foreground">
              Nenhum consumo para os filtros selecionados.
            </p>
          </section>

          <section class="space-y-2">
            <h4 class="text-sm font-medium">Por provider</h4>
            <div v-if="usage.by_provider.length" class="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead class="text-right">Quantidade</TableHead>
                    <TableHead class="text-right">Valor ao cliente</TableHead>
                    <TableHead class="text-right">Custo supplier</TableHead>
                    <TableHead class="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in usage.by_provider" :key="row.provider">
                    <TableCell>{{ row.provider || "desconhecido" }}</TableCell>
                    <TableCell class="text-right">{{ formatNumber(row.quantity) }}</TableCell>
                    <TableCell class="text-right">{{ formatCents(row.customer_amount_cents) }}</TableCell>
                    <TableCell class="text-right">{{ formatCents(row.supplier_amount_cents) }}</TableCell>
                    <TableCell class="text-right">{{ formatCents(row.margin_amount_cents) }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p v-else class="text-sm text-muted-foreground">
              Nenhum consumo para os filtros selecionados.
            </p>
          </section>
        </template>

        <div v-else-if="loading" class="flex justify-center py-10">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2 } from "lucide-vue-next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { formatCents, type FinancialChannel, type ResourceUsageParams, type ResourceUsageResponse } from "@/contracts/financialLedger";
import { getResourceUsage } from "@/services/financialLedger";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const usage = ref<ResourceUsageResponse | null>(null);
const loading = ref(false);
const errorMessage = ref("");

const filters = reactive<{
  campaign_id: string;
  channel: string;
  billable_resource: string;
  provider: string;
  supplier: string;
  date_from: string;
  date_to: string;
}>({
  campaign_id: String(route.query.campaign_id ?? ""),
  channel: "all",
  billable_resource: "",
  provider: "",
  supplier: "",
  date_from: "",
  date_to: "",
});

const campaignIdFromRoute = computed(() => {
  const id = Number(route.query.campaign_id);
  return Number.isFinite(id) && id > 0 ? id : null;
});

function clearCampaignFilter() {
  filters.campaign_id = "";
  router.replace({ query: { ...route.query, campaign_id: undefined } });
  applyFilters();
}

function buildParams(): ResourceUsageParams {
  const filterId = workspaceStore.activeGroupProject?.id ?? "";
  return {
    filter_id: filterId || "all",
    campaign_id: filters.campaign_id ? Number(filters.campaign_id) : null,
    channel: filters.channel === "all" ? null : (filters.channel as FinancialChannel | null),
    billable_resource: filters.billable_resource || null,
    provider: filters.provider || null,
    supplier: filters.supplier || null,
    date_from: filters.date_from || null,
    date_to: filters.date_to || null,
  };
}

async function applyFilters() {
  loading.value = true;
  errorMessage.value = "";

  try {
    usage.value = await getResourceUsage(buildParams());
  } catch (error) {
    usage.value = null;
    errorMessage.value = getHttpMessage(
      error,
      "Não foi possível carregar o uso de recursos. Você tem acesso a este projeto/workspace?",
    );
  } finally {
    loading.value = false;
  }
}

onMounted(applyFilters);

watch(() => filters.channel, () => applyFilters());

watch(
  () => workspaceStore.activeGroupProject?.id,
  () => {
    if (!usage.value) return;
    applyFilters();
  },
);

useScreenContext(
  "Uso de recursos - Consulta agregada de consumo do ledger financeiro",
  () => ({
    ...buildParams(),
    has_data: usage.value ? "yes" : "no",
  }),
  "/v1/financial/resource-usage",
);

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatNumber(value: number) {
  return numberFormatter.format(value);
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

const StatBlock = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "rounded-md border p-3" }, [
        h("div", { class: "text-xs uppercase text-muted-foreground" }, props.label),
        h("div", { class: "mt-1 text-sm font-medium break-words" }, props.value),
      ]);
  },
});
</script>