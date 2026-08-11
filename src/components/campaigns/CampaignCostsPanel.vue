<template>
  <Card>
    <CardHeader class="flex flex-row items-start justify-between gap-3 space-y-0">
      <div class="space-y-1">
        <CardTitle>Custos da campanha</CardTitle>
        <CardDescription>
          Estimado, reservado e realizado a partir do ledger de recursos.
        </CardDescription>
      </div>
      <Button size="sm" variant="outline" :disabled="loading" @click="refresh">
        {{ loading ? "Atualizando..." : "Atualizar" }}
      </Button>
    </CardHeader>
    <CardContent class="space-y-6">
      <p v-if="!costs && loading" class="text-sm text-muted-foreground">
        Carregando custos...
      </p>
      <Alert v-else-if="errorMessage" variant="destructive">
        <AlertTitle>Custos indisponíveis</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>
      <template v-else-if="costs">
        <div class="flex flex-wrap items-center gap-2">
          <Badge v-if="financialStatus" :variant="financialStatusVariant(financialStatus)">
            {{ FINANCIAL_STATUS_LABELS[financialStatus] }}
          </Badge>
          <Badge v-else variant="outline">Sem estimativa financeira</Badge>
          <span class="text-xs text-muted-foreground">
            Atualizado: {{ formatDateTime(costs.timestamps.updated_at) }}
          </span>
          <span v-if="costs.timestamps.last_consumption_at" class="text-xs text-muted-foreground">
            · último consumo: {{ formatDateTime(costs.timestamps.last_consumption_at) }}
          </span>
        </div>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Custos</h4>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatBlock label="Custo estimado" :value="formatCents(costs.estimate?.estimated_customer_amount_cents)" />
            <StatBlock label="Valor reservado" :value="formatCents(reservedTotal)" />
            <StatBlock label="Valor realizado" :value="formatCents(costs.realized.customer_amount_cents)" />
            <StatBlock label="Moeda" :value="costs.currency" />
          </div>
        </section>

        <section v-if="costs.estimate" class="space-y-2">
          <h4 class="text-sm font-medium">Estimativa</h4>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatBlock label="Destinatários estimados" :value="formatNumber(costs.estimate.estimated_recipients)" />
            <StatBlock label="Segmentos SMS estimados" :value="formatNumber(costs.estimate.estimated_sms_segments)" />
            <StatBlock label="Preço comercial unitário" :value="formatCents(costs.estimate.customer_unit_price_cents)" />
            <StatBlock label="Custo supplier unitário" :value="formatCents(costs.estimate.supplier_unit_cost_cents)" />
            <StatBlock label="Custo estimado (cliente)" :value="formatCents(costs.estimate.estimated_customer_amount_cents)" />
            <StatBlock label="Margem estimada" :value="formatCents(costs.margins.estimated_margin_amount_cents)" />
          </div>
          <p v-if="costs.estimate.supplier_unit_cost_cents === null" class="text-xs font-medium text-amber-600">
            Sem rate card de fornecedor — custo de supplier e margem indisponíveis.
          </p>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Realizado</h4>
          <div v-if="costs.realized.quantity > 0" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatBlock label="Quantidade" :value="`${formatNumber(costs.realized.quantity)} ${costs.realized.unit}`" />
            <StatBlock label="Valor ao cliente" :value="formatCents(costs.realized.customer_amount_cents)" />
            <StatBlock label="Custo supplier" :value="formatCents(costs.realized.supplier_amount_cents)" />
            <StatBlock label="Margem realizada" :value="formatCents(costs.margins.realized_margin_amount_cents)" />
          </div>
          <p v-else class="text-sm text-muted-foreground">Nenhum consumo realizado até o momento.</p>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Reservas por status</h4>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="status in reservationStatuses" :key="status" class="rounded-md border p-3">
              <div class="text-xs uppercase text-muted-foreground">
                {{ FINANCIAL_STATUS_LABELS[status] }}
              </div>
              <div class="mt-1 text-sm font-medium">
                {{ formatNumber(costs.reservations_by_status[status]?.quantity ?? 0) }}
                <span class="font-normal text-muted-foreground">un</span>
              </div>
              <div class="mt-1 text-sm text-muted-foreground">
                {{ formatCents(costs.reservations_by_status[status]?.customer_amount_cents) }}
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Breakdown por dispatch</h4>
          <div v-if="costs.breakdown_by_dispatch.length" class="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch</TableHead>
                  <TableHead class="text-right">Quantidade</TableHead>
                  <TableHead class="text-right">Valor ao cliente</TableHead>
                  <TableHead class="text-right">Custo supplier</TableHead>
                  <TableHead class="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row in costs.breakdown_by_dispatch" :key="row.campaign_dispatch_id">
                  <TableCell>#{{ row.campaign_dispatch_id }}</TableCell>
                  <TableCell class="text-right">{{ formatNumber(row.quantity) }} {{ row.unit }}</TableCell>
                  <TableCell class="text-right">{{ formatCents(row.customer_amount_cents) }}</TableCell>
                  <TableCell class="text-right">{{ formatCents(row.supplier_amount_cents) }}</TableCell>
                  <TableCell class="text-right">{{ formatCents(row.margin_amount_cents) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p v-else class="text-sm text-muted-foreground">Nenhum consumo por dispatch.</p>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">Breakdown por recurso</h4>
          <div v-if="costs.breakdown_by_resource.length" class="overflow-x-auto rounded-md border">
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
                <TableRow v-for="row in costs.breakdown_by_resource" :key="row.billable_resource_id ?? row.billable_resource">
                  <TableCell>{{ row.billable_resource || "desconhecido" }}</TableCell>
                  <TableCell>{{ row.channel || "—" }}</TableCell>
                  <TableCell class="text-right">{{ formatNumber(row.quantity) }} {{ row.unit }}</TableCell>
                  <TableCell class="text-right">{{ formatCents(row.customer_amount_cents) }}</TableCell>
                  <TableCell class="text-right">{{ formatCents(row.supplier_amount_cents) }}</TableCell>
                  <TableCell class="text-right">{{ formatCents(row.margin_amount_cents) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p v-else class="text-sm text-muted-foreground">Nenhum recurso utilizado.</p>
        </section>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FINANCIAL_STATUS_LABELS,
  deriveFinancialStatus,
  formatCents,
  type CampaignCostsResponse,
  type FinancialStatus,
} from "@/contracts/financialLedger";
import { getCampaignCosts } from "@/services/financialLedger";

const props = defineProps<{
  campaignId: number | null;
}>();

const emit = defineEmits<{
  "financial-status": [value: FinancialStatus | null];
}>();

const costs = ref<CampaignCostsResponse | null>(null);
const loading = ref(false);
const errorMessage = ref("");

const financialStatus = computed(() => deriveFinancialStatus(costs.value));

const reservationStatuses = ["reserved", "partially_consumed", "consumed", "released"] as const;

const reservedTotal = computed(() => {
  if (!costs.value) return 0;
  const r = costs.value.reservations_by_status;
  return (
    (r.reserved?.customer_amount_cents ?? 0) +
    (r.partially_consumed?.customer_amount_cents ?? 0) +
    (r.consumed?.customer_amount_cents ?? 0)
  );
});

onMounted(() => refresh());

watch(financialStatus, (value) => emit("financial-status", value), { immediate: true });

async function refresh() {
  if (!props.campaignId) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    costs.value = await getCampaignCosts(props.campaignId);
  } catch (error) {
    errorMessage.value =
      getHttpMessage(error, "Não foi possível carregar os custos da campanha.");
  } finally {
    loading.value = false;
  }
}

defineExpose({ refresh });

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function financialStatusVariant(status: FinancialStatus) {
  if (status === "consumed") return "default";
  if (status === "partially_consumed") return "secondary";
  if (status === "released") return "outline";
  return "secondary";
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