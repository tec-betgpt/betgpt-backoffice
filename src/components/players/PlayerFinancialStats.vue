<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

    <Card class="shadow-sm">
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

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Total Logins</CardTitle>
        <LogInIcon class="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-slate-900 dark:text-white">
          {{ stats?.total_logins || 0 }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">Acessos registrados</p>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Último Login</CardTitle>
        <ClockIcon class="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div class="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
          {{ formatDateTime(stats?.last_login_at) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">Último acesso ao sistema</p>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Data FTD</CardTitle>
        <CalendarIcon class="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div class="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
          {{ formatDate(stats?.first_deposit_at) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">Primeiro depósito aprovado</p>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Valor FTD</CardTitle>
        <BanknoteIcon class="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {{ formatCurrency(stats?.first_deposit_value || 0) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">Valor do primeiro depósito</p>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Último Depósito</CardTitle>
        <WalletIcon class="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div class="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
          {{ formatDateTime(stats?.last_deposit_at) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">Última entrada aprovada</p>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Último Saque</CardTitle>
        <WalletIcon class="h-4 w-4 text-rose-500" />
      </CardHeader>
      <CardContent>
        <div class="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
          {{ formatDateTime(stats?.last_withdrawal_at) }}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1">Última saída aprovada</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  BanknoteIcon,
  CalendarIcon,
  ClockIcon,
  LogInIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-vue-next";

defineProps<{
  stats: {
    total_deposits: number;
    total_withdrawals: number;
    deposits_count: number;
    withdrawals_count: number;
    ggr: number;
    total_logins?: number;
    last_login_at?: string | null;
    first_deposit_at?: string | null;
    first_deposit_value?: number | null;
    last_deposit_at?: string | null;
    last_withdrawal_at?: string | null;
  };
}>();

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date?: string | null) => {
  if (!date) return '---';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
  }).format(new Date(date));
};

const formatDateTime = (date?: string | null) => {
  if (!date) return '---';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(date));
};

const getGGRColor = (value: number) => {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-900 dark:text-white';
};
</script>
