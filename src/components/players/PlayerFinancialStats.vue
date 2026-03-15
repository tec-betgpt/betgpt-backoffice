<template>
  <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Total Depositado</CardTitle>
        <ArrowDownCircleIcon class="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {{ formatCurrency(stats?.total_deposits || 0) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">
          {{ stats?.deposits_count || 0 }} transações realizadas
        </p>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Total Sacado</CardTitle>
        <ArrowUpCircleIcon class="h-4 w-4 text-rose-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-rose-600 dark:text-rose-400">
          {{ formatCurrency(stats?.total_withdrawals || 0) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">
          {{ stats?.withdrawals_count || 0 }} saques aprovados
        </p>
      </CardContent>
    </Card>

    <Card class="shadow-sm col-span-2 lg:col-span-1">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">GGR (Net Win)</CardTitle>
        <TrendingUpIcon class="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold" :class="getGGRColor(stats?.ggr)">
          {{ formatCurrency(stats?.ggr || 0) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">
          Resultado líquido do jogador
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircleIcon, ArrowUpCircleIcon, TrendingUpIcon } from "lucide-vue-next";

defineProps<{
  stats: {
    total_deposits: number;
    total_withdrawals: number;
    deposits_count: number;
    withdrawals_count: number;
    ggr: number;
  };
}>();

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getGGRColor = (value: number) => {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-900 dark:text-white';
};
</script>
