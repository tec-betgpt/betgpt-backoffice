<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">FTD</CardTitle>
        <BanknoteIcon class="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Valor</p>
            <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
              {{ formatCurrency(stats?.first_deposit_value || 0) }}
            </div>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Data</p>
            <div class="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {{ formatDate(stats?.first_deposit_at) }}
            </div>
          </div>
        </div>
        <p class="text-[10px] text-muted-foreground mt-2">Primeiro depósito aprovado</p>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Depósitos</CardTitle>
        <ArrowDownCircleIcon class="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Total Depositado</p>
            <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
              {{ formatCurrency(stats?.total_deposits || 0) }}
            </div>
            <p class="text-[10px] text-muted-foreground mt-1">
              {{ stats?.deposits_count || 0 }} transações
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Último depósito</p>
            <div class="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {{ formatDateTime(stats?.last_deposit_at) }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Saques</CardTitle>
        <ArrowUpCircleIcon class="h-4 w-4 text-rose-500" />
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Total Sacado</p>
            <div class="text-xl font-bold text-rose-600 dark:text-rose-400 leading-tight">
              {{ formatCurrency(stats?.total_withdrawals || 0) }}
            </div>
            <p class="text-[10px] text-muted-foreground mt-1">
              {{ stats?.withdrawals_count || 0 }} saques aprovados
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Último saque</p>
            <div class="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {{ formatDateTime(stats?.last_withdrawal_at) }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-xs font-semibold text-muted-foreground uppercase">Logins</CardTitle>
        <LogInIcon class="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Total</p>
            <div class="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {{ stats?.total_logins || 0 }}
            </div>
            <p class="text-[10px] text-muted-foreground mt-1">Acessos registrados</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-tight">Último login</p>
            <div class="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {{ formatDateTime(stats?.last_login_at) }}
            </div>
            <p class="text-[10px] mt-1" :class="stats?.is_online ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">
              {{ stats?.is_online ? 'Online agora' : 'Offline' }}
              <span v-if="stats?.last_presence_at"> · {{ formatDateTime(stats.last_presence_at) }}</span>
            </p>
          </div>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  BanknoteIcon,
  LogInIcon,
  TrendingUpIcon,
} from "lucide-vue-next";

import moment from "moment";

defineProps<{
  stats: {
    total_deposits: number;
    total_withdrawals: number;
    deposits_count: number;
    withdrawals_count: number;
    ggr: number;
    total_logins?: number;
    last_login_at?: string | null;
    is_online?: boolean;
    last_presence_at?: string | null;
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
  const raw = String(date).trim();
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly && !raw.includes('T') && raw.length <= 10) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  }
  const parsed = moment(raw);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '---';
};

const formatDateTime = (date?: string | null) => {
  if (!date) return '---';
  const parsed = moment(date);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : '---';
};

const getGGRColor = (value: number) => {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-900 dark:text-white';
};
</script>
