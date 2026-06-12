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

      <FinancialImportHistoriesDialog
        :project-id="projectId"
        :reload="reloadFinancialsAfterMutation"
      />
    </div>

    <div class="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Centro de custo</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead class="text-right">Valor</TableHead>
            <TableHead class="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow class="bg-gray-50/10 font-bold">
            <TableCell>Total Geral</TableCell>
            <TableCell colspan="5"></TableCell>
            <TableCell class="text-right" :class="globalTotals.balance < 0 ? 'text-red-600' : 'text-green-600'">
              {{ formatCurrency(globalTotals.balance) }}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>

          <template v-if="isLoading">
            <TableRow v-for="row in 7" :key="row">
              <TableCell v-for="col in 8" :key="col">
                <Skeleton class="h-4 w-full bg-gray-300 my-4" />
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow v-for="transaction in transactions" :key="transaction.id">
              <TableCell>{{ transaction.costCenter }}</TableCell>
              <TableCell>{{ transaction.sectorName }}</TableCell>
              <TableCell>{{ formatCategory(transaction.category_type) }}</TableCell>
              <TableCell>
                <div
                  :title="transaction.description || '—'"
                  class="text-ellipsis overflow-hidden whitespace-nowrap max-w-[240px]"
                >
                  {{ transaction.description || "—" }}
                </div>
              </TableCell>
              <TableCell>{{ formatDate(transaction.date) }}</TableCell>
              <TableCell>
                <Badge v-if="transaction.type === 'revenue'" class="bg-green-500 text-white hover:bg-green-500">
                  Entrada
                </Badge>
                <Badge v-else variant="outline" class="bg-red-500 text-white hover:bg-red-500">
                  Saída
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                {{ formatCurrency(transaction.amount) }}
              </TableCell>
              <TableCell class="text-right">
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
              <TableCell colspan="8" class="h-24 text-center text-muted-foreground">
                Nenhuma transação financeira encontrada.
              </TableCell>
            </TableRow>

            <TableRow class="font-medium bg-muted/30">
              <TableCell>Subtotal da Página</TableCell>
              <TableCell colspan="5" class="text-muted-foreground">
                Soma dos itens renderizados nesta página
              </TableCell>
              <TableCell class="text-right" :class="pageSubtotal < 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(pageSubtotal) }}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import EditDialogComponent from "@/components/financial/EditDialogComponent.vue";
import FinancialImportHistoriesDialog from "@/components/financial/FinancialImportHistoriesDialog.vue";

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