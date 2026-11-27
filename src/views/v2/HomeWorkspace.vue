<script setup lang="ts">
import { computed, ref, shallowRef, watch, type Component } from "vue";
import type { DateRange } from "reka-ui";
import moment from "moment";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarCheck2,
  ChartCandlestick,
  ChartNoAxesColumn,
  CirclePercent,
  DollarSign,
  Hourglass,
  LogIn,
  RefreshCcw,
  TrendingUp,
  UserRound,
  UserRoundPlus,
  Users,
  Wallet,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart } from "@/components/ui/chart-bar";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import CustomChartTooltipRealPrice from "@/components/custom/CustomChartTooltipRealPrice.vue";
import InvoiceDueNoticeComponent from "@/components/invoices/InvoiceDueNoticeComponent.vue";
import Home from "@/services/home";
import toCurrency from "@/filters/currencyFilter";
import toK from "@/filters/numberFilter";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{ isShowValues?: boolean }>(), { isShowValues: false });

type Tile = {
  label: string;
  icon: Component;
  value: string;
  hint?: string;
  variation?: number | null;
};

type Section = { id: string; title: string; icon: Component; tone: string; tiles: Tile[] };

const auth = useAuthStore();
const workspace = useWorkspaceStore();

const selectedRange = shallowRef<DateRange>({} as DateRange);
const loading = ref(true);
const refreshing = ref(false);
const data = ref<any>(null);

const money = (cents: unknown) => toCurrency(Number(cents ?? 0) / 100);
const count = (value: unknown) => Number(value ?? 0).toLocaleString("pt-BR");
const percent = (value: unknown) => `${Number(value ?? 0).toFixed(2).replace(".", ",")}%`;

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
});

const firstName = computed(() => (auth.user as any)?.first_name ?? "");

const deposits = computed(() => data.value?.deposits ?? {});
const withdraws = computed(() => data.value?.withdraws ?? {});
const players = computed(() => data.value?.players ?? {});
const activeNow = computed(() => data.value?.active_now ?? {});
const retention = computed(() => data.value?.retention ?? {});

const grossMargin = computed(() => {
  const inflow = Number(deposits.value.total_paid_deposits ?? 0);
  const outflow = Number(withdraws.value.total_paid_withdraws ?? 0);
  return inflow > 0 ? ((inflow - outflow) / inflow) * 100 : 0;
});

const highlights = computed<Tile[]>(() => [
  { label: "Entradas confirmadas", icon: DollarSign, value: money(deposits.value.total_paid_deposits), hint: `${count(deposits.value.paid_deposits)} entradas` },
  { label: "Saídas confirmadas", icon: BanknoteArrowUp, value: money(withdraws.value.total_paid_withdraws), hint: `${count(withdraws.value.paid_withdraws)} saídas` },
  { label: "Retorno bruto", icon: Banknote, value: money(deposits.value.total_net_deposits), hint: `Margem de ${percent(grossMargin.value)}` },
  { label: "Clientes ativos", icon: UserRound, value: count(activeNow.value.count), variation: activeNow.value.change },
]);

const sections = computed<Section[]>(() => [
  {
    id: "receita",
    title: "Receita",
    icon: Wallet,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    tiles: [
      { label: "Entradas nos últimos 7 dias", icon: CalendarCheck2, value: money(deposits.value.total), variation: deposits.value.percentage },
      { label: "Entradas geradas", icon: BanknoteArrowDown, value: money(deposits.value.total_pending_deposits), hint: `${count(deposits.value.generated_deposits)} geradas` },
      { label: "Taxa de aprovação", icon: CirclePercent, value: percent(deposits.value.conversion_rate) },
      { label: "Ticket médio de entrada", icon: ChartCandlestick, value: money(deposits.value.average_ticket) },
      { label: "Retorno de performance", icon: TrendingUp, value: toCurrency(Number(deposits.value.performance_return_total ?? 0)) },
      { label: "Primeiras entradas", icon: BadgeCheck, value: money(deposits.value.total_ftd_amount), hint: `${count(deposits.value.total_ftd_count)} clientes` },
    ],
  },
  {
    id: "saidas",
    title: "Saídas",
    icon: BanknoteArrowUp,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    tiles: [
      { label: "Saídas nos últimos 7 dias", icon: CalendarCheck2, value: money(withdraws.value.total), variation: withdraws.value.percentage },
      { label: "Saídas solicitadas", icon: BanknoteArrowUp, value: money(withdraws.value.total_pending_withdraws), hint: `${count(withdraws.value.generated_withdraws)} pedidos` },
      { label: "Taxa de aprovação", icon: CirclePercent, value: percent(withdraws.value.conversion_rate) },
      { label: "Ticket médio de saída", icon: ChartNoAxesColumn, value: money(withdraws.value.average_ticket) },
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: Users,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    tiles: [
      { label: "Total de cadastros", icon: Users, value: count(players.value.count), variation: players.value.change },
      { label: "Novos cadastros", icon: UserRoundPlus, value: count(players.value.registered_users_day) },
      { label: "Logins", icon: LogIn, value: count(players.value.player_logins) },
      { label: "Conversão geral", icon: CirclePercent, value: percent(Number(players.value.ftd_general_percent ?? 0) / 100) },
      { label: "Convertidos no D0", icon: Wallet, value: money(players.value.ftd_registered_users_amount), hint: `${count(players.value.ftd_registered_users_count)} · ${percent(Number(players.value.ftd_registered_users_percent ?? 0) / 100)}` },
      { label: "Convertidos depois do D0", icon: CalendarCheck2, value: money(players.value.ftd_post_d0_amount), hint: `${count(players.value.ftd_post_d0_count)} · ${percent(players.value.ftd_post_d0_percent)}` },
    ],
  },
  {
    id: "retencao",
    title: "Retenção",
    icon: Hourglass,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tiles: [
      { label: "Tempo médio de retenção", icon: Hourglass, value: String(retention.value.time ?? "—") },
      { label: "Ticket médio pós-ativação", icon: ChartNoAxesColumn, value: money(retention.value.ticket_avg) },
    ],
  },
]);

const lastDeposits = computed(() =>
  [...(deposits.value.lasts ?? [])]
    .sort((a: any, b: any) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf())
    .slice(0, 8),
);

const updatedAt = computed(() => {
  const info = data.value?.execution_info;
  return info?.updated_at ? moment(info.updated_at).format("DD/MM HH:mm") : null;
});

const load = async () => {
  if (!workspace.activeGroupProject?.id || !selectedRange.value?.start) return;
  loading.value = true;
  try {
    const response = await Home.index({
      filter_id: workspace.activeGroupProject.id,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
    });
    data.value = response.data;
  } catch (_) {
    toast.error("Erro ao carregar a Home", { description: "Não foi possível buscar os indicadores." });
  }
  loading.value = false;
};

const refresh = async () => {
  if (!workspace.activeGroupProject?.id) return;
  refreshing.value = true;
  try {
    await Home.refresh({ filter_id: workspace.activeGroupProject.id });
    await load();
  } catch (_) {
    toast.error("Não foi possível atualizar agora");
  }
  refreshing.value = false;
};

watch(selectedRange, load);

const variationClass = (value: number) =>
  value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
</script>

<template>
  <div class="mx-auto w-full max-w-7xl pb-12">
    <InvoiceDueNoticeComponent class="relative z-30 mb-4" />

    <div class="flex flex-col gap-3 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ greeting }}{{ firstName ? `, ${firstName}` : "" }}</h1>
        <p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          {{ workspace.activeGroupProject?.name }}
          <template v-if="updatedAt">
            · atualizado às {{ updatedAt }}
            <button type="button" class="rounded p-0.5 hover:text-foreground" title="Atualizar" @click="refresh">
              <RefreshCcw class="size-3.5" :class="refreshing && 'animate-spin'" />
            </button>
          </template>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <router-link :to="{ name: 'home.classic' }" class="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Dashboard clássico
        </router-link>
        <div class="rounded-md bg-card">
          <CustomDatePicker v-model="selectedRange" />
        </div>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="tile in highlights" :key="tile.label" class="p-4">
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm text-muted-foreground">{{ tile.label }}</p>
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <component :is="tile.icon" class="size-4" />
          </span>
        </div>
        <Skeleton v-if="loading" class="mt-2 h-8 w-2/3" />
        <p v-else class="mt-1 text-2xl font-semibold tabular-nums">
          {{ props.isShowValues ? tile.value : "••••••" }}
        </p>
        <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <template v-if="tile.variation != null && !loading">
            <span :class="cn('flex items-center font-medium', variationClass(Number(tile.variation)))">
              <ArrowUpRight v-if="Number(tile.variation) >= 0" class="size-3.5" />
              <ArrowDownRight v-else class="size-3.5" />
              {{ Math.abs(Number(tile.variation)).toFixed(1).replace(".", ",") }}%
            </span>
            vs. período anterior
          </template>
          <template v-else>{{ loading || !props.isShowValues ? "" : tile.hint }}</template>
        </p>
      </Card>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <Card v-for="section in sections" :key="section.id" class="p-4 sm:p-5">
        <div class="mb-3 flex items-center gap-2.5">
          <span :class="cn('flex size-8 items-center justify-center rounded-lg', section.tone)">
            <component :is="section.icon" class="size-4" />
          </span>
          <h2 class="font-semibold">{{ section.title }}</h2>
        </div>
        <div class="grid grid-cols-2 gap-2 2xl:grid-cols-3">
          <div
            v-for="tile in section.tiles"
            :key="tile.label"
            class="rounded-lg border bg-muted/30 p-3"
          >
            <div class="flex items-start gap-1.5 text-xs text-muted-foreground">
              <component :is="tile.icon" class="mt-px size-3.5 shrink-0" />
              <span class="line-clamp-2">{{ tile.label }}</span>
            </div>
            <Skeleton v-if="loading" class="mt-2 h-5 w-3/4" />
            <p v-else class="mt-1 truncate text-base font-semibold tabular-nums">
              {{ props.isShowValues ? tile.value : "••••" }}
            </p>
            <p v-if="!loading && (tile.hint || tile.variation != null)" class="mt-0.5 truncate text-[11px] text-muted-foreground">
              <span v-if="tile.variation != null" :class="variationClass(Number(tile.variation))">
                {{ Number(tile.variation) >= 0 ? "+" : "" }}{{ Number(tile.variation).toFixed(1).replace(".", ",") }}%
              </span>
              <template v-else-if="props.isShowValues">{{ tile.hint }}</template>
            </p>
          </div>
        </div>
      </Card>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-5">
      <Card class="p-4 sm:p-5 lg:col-span-3">
        <h2 class="font-semibold">Histórico de entradas</h2>
        <p class="text-xs text-muted-foreground">Total por mês</p>
        <Skeleton v-if="loading" class="mt-4 h-56 w-full" />
        <BarChart
          v-else
          class="mt-4 h-56 w-full"
          :data="deposits.monthly_counts ?? []"
          :categories="['Total']"
          index="name"
          :rounded-corners="4"
          :show-tooltip="props.isShowValues"
          :y-formatter="(tick: number | Date) => (typeof tick === 'number' ? toK(tick) : '')"
          :custom-tooltip="CustomChartTooltipRealPrice"
        />
      </Card>

      <Card class="p-4 sm:p-5 lg:col-span-2">
        <h2 class="font-semibold">Últimas entradas</h2>
        <p class="text-xs text-muted-foreground">
          {{ deposits.count30days != null ? `${count(deposits.count30days)} nos últimos 30 dias` : "Mais recentes" }}
        </p>
        <div v-if="loading" class="mt-4 space-y-3">
          <Skeleton v-for="n in 5" :key="n" class="h-8 w-full" />
        </div>
        <ul v-else-if="lastDeposits.length" class="mt-3 divide-y">
          <li v-for="item in lastDeposits" :key="item.id" class="flex items-center gap-3 py-2">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign class="size-4" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ item.player?.name ?? "—" }}</span>
              <span class="block text-xs text-muted-foreground">{{ moment(item.created_at).fromNow() }}</span>
            </span>
            <span class="text-sm font-semibold tabular-nums">
              {{ props.isShowValues ? money(item.value) : "••••" }}
            </span>
          </li>
        </ul>
        <p v-else class="py-10 text-center text-sm text-muted-foreground">Nenhuma entrada no período.</p>
      </Card>
    </div>
  </div>
</template>
