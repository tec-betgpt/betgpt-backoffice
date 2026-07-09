<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Sparkles, Wallet, TrendingUp, Dices, Trophy } from "lucide-vue-next";
import PlayersService from "@/services/players";
import RiskHourlyChart from "@/components/risk/RiskHourlyChart.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SmarticoSnapshot = {
  casino_turnover: number;
  casino_ggr: number;
  sport_ggr: number;
  wallet_total_balance: number;
  wallet_real_balance: number;
  wallet_bonus_balance: number;
  bonus_amount: number;
};

type SmarticoChart = {
  title: string;
  value_type: "money" | "integer";
  chart_type: "area" | "line" | "bar";
  x_axis: string[];
  series: Array<{ key: string; label: string; data: (number | null)[] }>;
};

type SmarticoPlayerResponse = {
  available: boolean;
  has_data?: boolean;
  message?: string;
  meta?: {
    reference_date?: string;
    reference_hour?: number;
    last_sync_at?: string;
  };
  snapshot?: SmarticoSnapshot;
  charts?: {
    wallet_total_balance?: SmarticoChart;
    casino_ggr?: SmarticoChart;
  };
};

const props = defineProps<{
  playerId: number;
  projectId: number | null;
}>();

const status = ref<"idle" | "loading" | "success" | "empty" | "hidden">("idle");
const payload = ref<SmarticoPlayerResponse | null>(null);

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMoney(value?: number | null) {
  return moneyFormatter.format(Number(value) || 0);
}

function formatSyncAt(value?: string | null) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const emptyMessage = computed(() => {
  return payload.value?.message
    || "Ainda não há dados Smartico deste jogador. Eles aparecem após a próxima sincronização.";
});

const kpiCards = computed(() => {
  const snapshot = payload.value?.snapshot;

  if (!snapshot) return [];

  return [
    {
      label: "Saldo Total",
      value: formatMoney(snapshot.wallet_total_balance),
      hint: `Real ${formatMoney(snapshot.wallet_real_balance)} · Bônus ${formatMoney(snapshot.wallet_bonus_balance)}`,
      icon: Wallet,
      accent: "from-violet-500/15 to-indigo-500/5 text-violet-700 dark:text-violet-300",
    },
    {
      label: "GGR Cassino",
      value: formatMoney(snapshot.casino_ggr),
      hint: "Resultado acumulado do dia",
      icon: Dices,
      accent: "from-amber-500/15 to-orange-500/5 text-amber-700 dark:text-amber-300",
    },
    {
      label: "Apostado Cassino",
      value: formatMoney(snapshot.casino_turnover),
      hint: "Volume apostado no cassino",
      icon: TrendingUp,
      accent: "from-emerald-500/15 to-teal-500/5 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "GGR Esportes",
      value: formatMoney(snapshot.sport_ggr),
      hint: payload.value?.meta?.reference_date || "Hoje",
      icon: Trophy,
      accent: "from-sky-500/15 to-cyan-500/5 text-sky-700 dark:text-sky-300",
    },
  ];
});

async function fetchSmartico() {
  if (!props.playerId || !props.projectId) {
    status.value = "hidden";
    return;
  }

  status.value = "loading";

  try {
    const response = await PlayersService.smartico(props.playerId, {
      filter_id: props.projectId,
    });

    if (!response.available) {
      status.value = "hidden";
      payload.value = null;
      return;
    }

    payload.value = response;
    status.value = response.has_data ? "success" : "empty";
  } catch {
    status.value = "hidden";
    payload.value = null;
  }
}

onMounted(fetchSmartico);

watch(
  () => [props.playerId, props.projectId],
  () => fetchSmartico(),
);
</script>

<template>
  <section v-if="status !== 'hidden'" class="space-y-4">
    <Card class="overflow-hidden border-none shadow-md bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white">
      <CardHeader class="pb-3">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2 text-lg md:text-xl text-white">
              <Sparkles class="h-5 w-5 text-amber-300" />
              Insights Smartico
            </CardTitle>
            <p class="text-xs text-slate-300">
              Dados atualizados ao longo do dia pela sincronização Smartico.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" class="bg-white/10 text-white hover:bg-white/10">
              Smartico
            </Badge>
            <Badge v-if="payload?.meta?.last_sync_at" variant="outline" class="border-white/20 text-white">
              Atualizado: {{ formatSyncAt(payload.meta.last_sync_at) }}
            </Badge>
          </div>
        </div>
      </CardHeader>
    </Card>

    <div v-if="status === 'loading'" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton class="h-28 rounded-xl" />
      <Skeleton class="h-28 rounded-xl" />
      <Skeleton class="h-72 rounded-xl lg:col-span-2" />
    </div>

    <div v-else-if="status === 'empty'" class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
      {{ emptyMessage }}
    </div>

    <template v-else-if="status === 'success' && payload">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          v-for="card in kpiCards"
          :key="card.label"
          class="border-none shadow-sm overflow-hidden"
        >
          <CardContent :class="['p-4 bg-gradient-to-br', card.accent]">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-2">
                <p class="text-[10px] font-bold uppercase tracking-wider opacity-80">{{ card.label }}</p>
                <p class="text-2xl font-bold">{{ card.value }}</p>
                <p class="text-[11px] opacity-70">{{ card.hint }}</p>
              </div>
              <component :is="card.icon" class="h-5 w-5 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card v-if="payload.charts?.wallet_total_balance" class="shadow-sm">
          <CardHeader>
            <CardTitle class="text-base">{{ payload.charts.wallet_total_balance.title }}</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskHourlyChart
              type="area"
              :categories="payload.charts.wallet_total_balance.x_axis"
              :series="payload.charts.wallet_total_balance.series"
              value-type="money"
            />
          </CardContent>
        </Card>

        <Card v-if="payload.charts?.casino_ggr" class="shadow-sm">
          <CardHeader>
            <CardTitle class="text-base">{{ payload.charts.casino_ggr.title }}</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskHourlyChart
              type="area"
              :categories="payload.charts.casino_ggr.x_axis"
              :series="payload.charts.casino_ggr.series"
              value-type="money"
            />
          </CardContent>
        </Card>
      </div>
    </template>
  </section>
</template>
