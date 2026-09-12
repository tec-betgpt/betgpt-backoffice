<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="grid w-full gap-2 md:grid-cols-[minmax(220px,1fr)_180px_220px_220px_auto] md:items-center">
        <Input
          :model-value="search"
          type="search"
          placeholder="Buscar por descrição"
          @update:model-value="(value) => onUpdateSearch?.(String(value ?? ''))"
          @keyup.enter="onSearch?.()"
        />

        <Select
          :model-value="type || 'all'"
          @update:model-value="(value) => onUpdateType?.(String(value === 'all' ? '' : value))"
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="cost">Custo</SelectItem>
            <SelectItem value="revenue">Receita</SelectItem>
          </SelectContent>
        </Select>

        <Select
          :model-value="costCenterId || 'all'"
          @update:model-value="(value) => onUpdateCostCenterId?.(String(value === 'all' ? '' : value))"
        >
          <SelectTrigger>
            <SelectValue placeholder="Centro de Custo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os centros</SelectItem>
            <SelectItem v-for="cost in costs" :key="cost.id" :value="String(cost.id)">
              {{ cost.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          :model-value="sectorId || 'all'"
          @update:model-value="(value) => onUpdateSectorId?.(String(value === 'all' ? '' : value))"
        >
          <SelectTrigger>
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            <SelectItem v-for="sector in sectors" :key="sector.id" :value="String(sector.id)">
              {{ sector.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" :disabled="isLoading" @click="onSearch?.()">
          Buscar
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <ColumnVisibilityToggle v-model="columnVisibility" :columns="tableColumns" />
        <FinancialImportHistoriesDialog
          :project-id="projectId"
          :reload="reloadFinancialsAfterMutation"
        />
      </div>
    </div>

    <div class="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead v-if="columnVisibility.costCenter !== false">Centro de custo</TableHead>
            <TableHead v-if="columnVisibility.sector !== false">Setor</TableHead>
            <TableHead v-if="columnVisibility.category !== false">Categoria</TableHead>
            <TableHead v-if="columnVisibility.description !== false">Descrição</TableHead>
            <TableHead v-if="columnVisibility.date !== false">Data</TableHead>
            <TableHead v-if="columnVisibility.type !== false">Tipo</TableHead>
            <TableHead v-if="columnVisibility.amount !== false" class="text-right">Valor</TableHead>
            <TableHead v-if="columnVisibility.actions !== false" class="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow class="bg-gray-50/10 font-bold">
            <TableCell v-if="columnVisibility.costCenter !== false">Total Geral</TableCell>
            <TableCell v-if="visibleMiddleColumnsCount > 0" :colspan="visibleMiddleColumnsCount"></TableCell>
            <TableCell v-if="columnVisibility.amount !== false" class="text-right" :class="globalTotals.balance < 0 ? 'text-red-600' : 'text-green-600'">
              {{ formatCurrency(globalTotals.balance) }}
            </TableCell>
            <TableCell v-if="columnVisibility.actions !== false"></TableCell>
          </TableRow>

          <template v-if="isLoading">
            <TableRow v-for="row in 7" :key="row">
              <TableCell v-for="col in visibleTableColumns.length" :key="col">
                <Skeleton class="h-4 w-full bg-gray-300 my-4" />
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow v-for="transaction in transactions" :key="transaction.id">
              <TableCell v-if="columnVisibility.costCenter !== false">{{ transaction.costCenter }}</TableCell>
              <TableCell v-if="columnVisibility.sector !== false">{{ transaction.sectorName }}</TableCell>
              <TableCell v-if="columnVisibility.category !== false">{{ formatCategory(transaction.category_type) }}</TableCell>
              <TableCell v-if="columnVisibility.description !== false">
                <div
                  :title="transaction.description || '—'"
                  class="text-ellipsis overflow-hidden whitespace-nowrap max-w-[240px]"
                >
                  {{ transaction.description || "—" }}
                </div>
              </TableCell>
              <TableCell v-if="columnVisibility.date !== false">{{ formatDate(transaction.date) }}</TableCell>
              <TableCell v-if="columnVisibility.type !== false">
                <Badge v-if="transaction.type === 'revenue'" class="bg-green-500 text-white hover:bg-green-500">
                  Entrada
                </Badge>
                <Badge v-else variant="outline" class="bg-red-500 text-white hover:bg-red-500">
                  Saída
                </Badge>
              </TableCell>
              <TableCell v-if="columnVisibility.amount !== false" class="text-right">
                {{ formatCurrency(transaction.amount) }}
              </TableCell>
              <TableCell v-if="columnVisibility.actions !== false" class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <EditDialogComponent
                    :reload="reloadFinancialsAfterMutation"
                    :row="transaction"
                    :costs="costs"
                    :sectors="sectors"
                  />

                  <DestroyDialogComponent
                    :reload="reloadFinancialsAfterMutation"
                    :destroy="deleteFinancial"
                    :row="transaction"
                  />
                </div>
              </TableCell>
            </TableRow>

            <TableRow v-if="!transactions.length">
              <TableCell :colspan="visibleTableColumns.length" class="h-24 text-center text-muted-foreground">
                Nenhuma transação financeira encontrada.
              </TableCell>
            </TableRow>

            <TableRow class="font-medium bg-muted/30">
              <TableCell v-if="columnVisibility.costCenter !== false">Subtotal da Página</TableCell>
              <TableCell v-if="visibleMiddleColumnsCount > 0" :colspan="visibleMiddleColumnsCount" class="text-muted-foreground">
                Soma dos itens renderizados nesta página
              </TableCell>
              <TableCell v-if="columnVisibility.amount !== false" class="text-right" :class="pageSubtotal < 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(pageSubtotal) }}
              </TableCell>
              <TableCell v-if="columnVisibility.actions !== false"></TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import EditDialogComponent from "@/components/financial/EditDialogComponent.vue";
import FinancialImportHistoriesDialog from "@/components/financial/FinancialImportHistoriesDialog.vue";
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";

export interface FinancialTransactionTableItem {
  id: number;
  costCenter: string;
  sectorName: string;
  category_type: string;
  amount: number | string;
  date: string;
  description: string | null;
  percentage: number | string | null;
  cost_center_id: number | null;
  sectorId: number | null;
  type: "cost" | "revenue" | string;
}

interface FinancialCostOption {
  id: number;
  name: string;
  sector: string;
  sector_id: number | null;
}

interface FinancialSectorOption {
  id: number;
  name: string;
}

interface FinancialGlobalTotals {
  total_revenue: number;
  total_expense: number;
  balance: number;
}

const props = withDefaults(defineProps<{
  transactions: FinancialTransactionTableItem[];
  isLoading?: boolean;
  search?: string;
  type?: string;
  costCenterId?: string;
  sectorId?: string;
  globalTotals?: FinancialGlobalTotals;
  onSearch?: () => void;
  onUpdateSearch?: (value: string) => void;
  onUpdateType?: (value: string) => void;
  onUpdateCostCenterId?: (value: string) => void;
  onUpdateSectorId?: (value: string) => void;
  projectId: string | number | null;
  reloadFinancialsAfterMutation: () => void;
  deleteFinancial: (id: number) => void;
  costs: FinancialCostOption[];
  sectors: FinancialSectorOption[];
}>(), {
  transactions: () => [],
  isLoading: false,
  search: "",
  type: "",
  costCenterId: "",
  sectorId: "",
  globalTotals: () => ({
    total_revenue: 0,
    total_expense: 0,
    balance: 0,
  }),
  costs: () => [],
  sectors: () => [],
});

const tableColumns = [
  { id: "costCenter", label: "Centro de custo" },
  { id: "sector", label: "Setor" },
  { id: "category", label: "Categoria" },
  { id: "description", label: "Descrição" },
  { id: "date", label: "Data" },
  { id: "type", label: "Tipo" },
  { id: "amount", label: "Valor" },
  { id: "actions", label: "Ações" },
];
const columnVisibility = ref<Record<string, boolean>>({});
const visibleTableColumns = computed(() =>
  tableColumns.filter((c) => columnVisibility.value[c.id] !== false)
);
const visibleMiddleColumnsCount = computed(() =>
  visibleTableColumns.value.filter((c) => !["costCenter", "amount", "actions"].includes(c.id)).length
);

const pageSubtotal = computed(() => props.transactions.reduce((total, transaction) => {
  const amount = Number(transaction.amount) || 0;

  return transaction.type === "revenue" ? total + amount : total - amount;
}, 0));

const formatCurrency = (value: number | string) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(Number(value) || 0);

const formatDate = (value: string) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
};

const formatCategory = (value: string) => value === "fixed" ? "Fixa" : "Variável";
</script>