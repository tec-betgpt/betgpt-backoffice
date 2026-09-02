<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import VueApexCharts from "vue3-apexcharts";
import { toast } from "vue-sonner";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import Analytics from "@/services/analytics";
import TargetAudience from "@/services/targetAudience";
import Tags from "@/services/tags";
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import SearchableCombobox from "@/components/custom/SearchableCombobox.vue";
import currencyFilter from "@/filters/currencyFilter";
import { formatMinifiedNumber, numberLocale } from "@/filters/formatNumbers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Percent,
  Repeat2,
  Wallet,
  PiggyBank,
  Activity,
  TrendingUp,
  Banknote,
  ArrowDownToLine,
} from "lucide-vue-next";

type SourceType = "segment" | "tag";

type AnalysisPayload = {
  source: { type: SourceType; id: number; name: string };
  kpis: Record<string, number>;
  performance: Record<string, number>;
  deposit_segmentation: Array<{ key: string; label: string; players: number; pct: number; revenue: number }>;
  funnel: Array<{ key: string; label: string; count: number; pct: number }>;
  retention: { d7: number; d14: number; d30: number };
  activity: Array<{ date: string; players: number; depositors: number; deposits_amount: number }>;
  meta?: Record<string, string>;
};

const apexchart = VueApexCharts;
const workspaceStore = useWorkspaceStore();

const selectedRange = ref<{ start: any; end: any }>({ start: null, end: null });
const sourceType = ref<SourceType>("segment");
const sourceId = ref<string>("");
const sourceOptions = ref<Array<{ id: number; name: string; color?: string }>>([]);
const sourceComboboxOptions = computed(() =>
  sourceOptions.value.map((option) => ({
    value: String(option.id),
    label: option.name,
    color: option.color || undefined,
  }))
);
const isLoadingSources = ref(false);
const isLoading = ref(false);
const analysis = ref<AnalysisPayload | null>(null);
const hasLoadedOnce = ref(false);

const isDark = ref(document.documentElement.classList.contains("dark"));

onMounted(() => {
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains("dark");
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  loadSources();
});

const kpis = computed(() => analysis.value?.kpis ?? null);
const performance = computed(() => analysis.value?.performance ?? null);

const kpiCards = computed(() => {
  const k = kpis.value;
  if (!k) return [];

  return [
    {
      title: "Total de Jogadores",
      value: formatMinifiedNumber(k.total_players),
      hint: `+${numberLocale(k.players_joined_period)} no período`,
      icon: Users,
    },
    {
      title: "Taxa de Conversão",
      value: `${numberLocale(k.conversion_rate)}%`,
      hint: `${numberLocale(k.depositors_count)} depositaram`,
      icon: Percent,
    },
    {
      title: "Depositaram Mais de Uma Vez",
      value: `${numberLocale(k.multi_deposit_rate)}%`,
      hint: `${numberLocale(k.multi_depositors)} usuários`,
      icon: Repeat2,
    },
    {
      title: "Depósito Médio",
      value: currencyFilter(k.avg_deposit),
      hint: `Total: ${currencyFilter(k.deposits_total)}`,
      icon: Wallet,
    },
    {
      title: "Depósitos",
      value: currencyFilter(k.deposits_total),
      hint: `${numberLocale(k.deposits_count)} transações, ${numberLocale(k.ftd_count)} FTDs`,
      icon: PiggyBank,
    },
    {
      title: "Retenção no período",
      value: `${numberLocale(k.retention_rate)}%`,
      hint: `${numberLocale(k.active_players)} jogadores ativos`,
      icon: Activity,
    },
    {
      title: "LTV Atual (Histórico)",
      value: currencyFilter(k.ltv),
      hint: "Por jogador com depósito",
      icon: TrendingUp,
    },
    {
      title: "Saques",
      value: currencyFilter(k.withdraws_total),
      hint: `${numberLocale(k.withdraws_count)} transações`,
      icon: Banknote,
    },
    {
      title: "Saque Médio",
      value: currencyFilter(k.avg_withdraw),
      hint: "No período selecionado",
      icon: ArrowDownToLine,
    },
    {
      title: "Retenção de Depósitos",
      value: `${numberLocale(k.deposit_retention_rate)}%`,
      hint: "Ativos entre depositantes (30d)",
      icon: Percent,
    },
  ];
});

const performanceCards = computed(() => {
  const p = performance.value;
  if (!p) return [];

  return [
    { title: "Depósito Médio (ticket)", value: currencyFilter(p.avg_deposit_ticket), hint: "Valor ÷ transações" },
    { title: "ARPU", value: currencyFilter(p.arpu), hint: "Receita ÷ total de usuários" },
    { title: "ARPPU", value: currencyFilter(p.arppu), hint: "Receita ÷ depositantes" },
    { title: "Receita Média (sem whales)", value: currencyFilter(p.avg_revenue_ex_whales), hint: "Exclui top 5%" },
    { title: "Mediana (P50)", value: currencyFilter(p.p50), hint: "50% depositaram abaixo" },
    { title: "P75", value: currencyFilter(p.p75), hint: "75% abaixo deste valor" },
    { title: "P90", value: currencyFilter(p.p90), hint: "90% abaixo deste valor" },
    { title: "P95 (Grandes Depositantes)", value: currencyFilter(p.p95), hint: "Corte do top 5%" },
    { title: "Grandes Depositantes", value: numberLocale(p.whales_count), hint: `${numberLocale(p.whales_pct)}% dos depositantes` },
    { title: "Receita dos Grandes Depositantes", value: currencyFilter(p.whales_revenue), hint: `${numberLocale(p.whales_revenue_pct)}% da receita` },
    { title: "Usuários Multi-Depósito", value: `${numberLocale(p.multi_deposit_users_pct)}%`, hint: `${numberLocale(p.multi_depositors_period)} no período` },
    { title: "Frequência Média de Depósitos", value: numberLocale(p.avg_deposit_frequency), hint: "Depósitos por depositante" },
    { title: "Tempo de Vida Médio", value: `${numberLocale(p.avg_lifetime_days)} dias`, hint: "1º → último depósito" },
    { title: "Taxa de Churn (30d)", value: `${numberLocale(p.churn_rate_30d)}%`, hint: "Sem atividade nos últimos 30 dias" },
    { title: "Receita Diária Média", value: currencyFilter(p.avg_daily_revenue), hint: "Por jogador ativo" },
  ];
});

const chartForeColor = computed(() => (isDark.value ? "#94a3b8" : "#64748b"));
const chartGridColor = computed(() => (isDark.value ? "#1e293b" : "#e2e8f0"));

const pieSeries = computed(() => (analysis.value?.deposit_segmentation ?? []).map((b) => b.players));
const pieLabels = computed(() => (analysis.value?.deposit_segmentation ?? []).map((b) => b.label));

const pieOptions = computed(() => ({
  chart: { type: "donut", foreColor: chartForeColor.value, background: "transparent" },
  labels: pieLabels.value,
  legend: { position: "bottom" },
  dataLabels: { enabled: true },
  tooltip: { theme: isDark.value ? "dark" : "light" },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          total: {
            show: true,
            label: "Jogadores",
            formatter: () => formatMinifiedNumber(kpis.value?.total_players ?? 0),
          },
        },
      },
    },
  },
}));

const revenueBarSeries = computed(() => [
  {
    name: "Receita",
    data: (analysis.value?.deposit_segmentation ?? []).map((b) => b.revenue),
  },
]);

const revenueBarOptions = computed(() => ({
  chart: { type: "bar", foreColor: chartForeColor.value, toolbar: { show: false }, background: "transparent" },
  plotOptions: { bar: { borderRadius: 4, columnWidth: "45%" } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: (analysis.value?.deposit_segmentation ?? []).map((b) => b.label),
    labels: { style: { colors: chartForeColor.value } },
  },
  yaxis: {
    labels: {
      style: { colors: chartForeColor.value },
      formatter: (v: number) => currencyFilter(v),
    },
  },
  grid: { borderColor: chartGridColor.value },
  tooltip: {
    theme: isDark.value ? "dark" : "light",
    y: { formatter: (v: number) => currencyFilter(v) },
  },
}));

const funnelSeries = computed(() => [
  {
    name: "Jogadores",
    data: (analysis.value?.funnel ?? []).map((f) => f.count),
  },
]);

const funnelOptions = computed(() => ({
  chart: { type: "bar", foreColor: chartForeColor.value, toolbar: { show: false }, background: "transparent" },
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
  dataLabels: {
    enabled: true,
    formatter: (_: number, opts: any) => {
      const item = analysis.value?.funnel?.[opts.dataPointIndex];
      return item ? `${numberLocale(item.count)} (${numberLocale(item.pct)}%)` : "";
    },
  },
  xaxis: {
    categories: (analysis.value?.funnel ?? []).map((f) => f.label),
    labels: { style: { colors: chartForeColor.value } },
  },
  yaxis: { labels: { style: { colors: chartForeColor.value } } },
  grid: { borderColor: chartGridColor.value },
  tooltip: { theme: isDark.value ? "dark" : "light" },
}));

const activitySeries = computed(() => [
  {
    name: "Jogadores com login",
    data: (analysis.value?.activity ?? []).map((a) => a.players),
  },
  {
    name: "Depositantes",
    data: (analysis.value?.activity ?? []).map((a) => a.depositors),
  },
]);

const activityOptions = computed(() => ({
  chart: { type: "area", foreColor: chartForeColor.value, toolbar: { show: false }, background: "transparent" },
  stroke: { curve: "smooth", width: 2 },
  dataLabels: { enabled: false },
  fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
  xaxis: {
    categories: (analysis.value?.activity ?? []).map((a) => a.date),
    labels: {
      style: { colors: chartForeColor.value },
      formatter: (v: string) => {
        if (!v) return "";
        const [, m, d] = String(v).split("-");
        return `${d}/${m}`;
      },
    },
  },
  yaxis: { labels: { style: { colors: chartForeColor.value } } },
  grid: { borderColor: chartGridColor.value },
  legend: { position: "top" },
  tooltip: { theme: isDark.value ? "dark" : "light" },
}));

async function loadSources() {
  if (!workspaceStore.activeGroupProject?.id) {
    sourceOptions.value = [];
    return;
  }

  isLoadingSources.value = true;
  sourceId.value = "";
  analysis.value = null;

  try {
    const filterId = workspaceStore.activeGroupProject.id;
    const list =
      sourceType.value === "segment"
        ? await TargetAudience.list({ filter_id: filterId, is_segment: true })
        : await Tags.list({ filter_id: filterId });

    sourceOptions.value = (Array.isArray(list) ? list : []).map((item: any) => ({
      id: item.id,
      name: item.name,
      color: item.color,
    }));
  } catch (error) {
    console.error(error);
    toast.error("Erro", { description: "Não foi possível carregar segmentos/tags." });
    sourceOptions.value = [];
  } finally {
    isLoadingSources.value = false;
  }
}

async function applyFilter() {
  if (!workspaceStore.activeGroupProject?.id) {
    toast.error("Erro", { description: "Selecione um grupo ou projeto antes de filtrar." });
    return;
  }

  if (!sourceId.value) {
    return;
  }

  if (!selectedRange.value.start || !selectedRange.value.end) {
    return;
  }

  isLoading.value = true;
  hasLoadedOnce.value = true;
  analysis.value = null;

  try {
    const { data } = await Analytics.segmentAnalysis({
      filter_id: workspaceStore.activeGroupProject.id,
      start_date: selectedRange.value.start?.toString(),
      end_date: selectedRange.value.end?.toString(),
      source_type: sourceType.value,
      source_id: Number(sourceId.value),
    });

    analysis.value = data as AnalysisPayload;
  } catch (error: any) {
    console.error(error);
    toast.error("Erro ao carregar análise", { description: error?.response?.data?.message || "Não foi possível aplicar o filtro selecionado." });
    analysis.value = null;
  } finally {
    isLoading.value = false;
  }
}

watch(sourceType, () => {
  loadSources();
});

watch(
  () => workspaceStore.activeGroupProject?.id,
  () => {
    loadSources();
  },
);

watch([selectedRange, sourceId], () => {
  applyFilter();
}, { deep: true });

useScreenContext(
  "Análise de Segmentos — métricas de depósito, retenção, LTV e funil por segmento ou tag",
  () => ({
    source_type: sourceType.value,
    source_id: sourceId.value,
    start_date: selectedRange.value.start ? selectedRange.value.start.toString() : "",
    end_date: selectedRange.value.end ? selectedRange.value.end.toString() : "",
  }),
  "/v1/analytics/segment-analysis",
);
</script>

<template>
  <div class="segment-analysis-page space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 lg:grid-cols-[1fr_auto] items-start">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Análise de Segmentos</h2>
        <p class="text-muted-foreground">
          Escolha um segmento ou uma tag e o período para montar o panorama de jogadores, depósitos, retenção e LTV.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:items-end">
        <div class="space-y-1.5 min-w-[140px]">
          <Label>Tipo</Label>
          <Select v-model="sourceType">
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="segment">Segmento</SelectItem>
              <SelectItem value="tag">Tag</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5 min-w-[220px]">
          <Label>{{ sourceType === "segment" ? "Segmento" : "Tag" }}</Label>
          <SearchableCombobox
            v-model="sourceId"
            :options="sourceComboboxOptions"
            :placeholder="isLoadingSources ? 'Carregando...' : 'Selecione'"
            :search-placeholder="sourceType === 'segment' ? 'Buscar segmento...' : 'Buscar tag...'"
            :empty-text="sourceType === 'segment' ? 'Nenhum segmento encontrado.' : 'Nenhuma tag encontrada.'"
            :disabled="isLoadingSources || sourceOptions.length === 0"
          />
        </div>

        <div class="space-y-1.5">
          <Label>Período</Label>
          <CustomDatePicker v-model="selectedRange" />
        </div>
      </div>
    </div>

    <div
      v-if="!sourceId || !selectedRange.start"
      class="rounded-lg border border-dashed p-10 text-center text-muted-foreground"
    >
      Selecione um {{ sourceType === "segment" ? "segmento" : "tag" }} e um período para carregar a análise.
    </div>

    <template v-else>
      <div v-if="isLoading" class="text-sm text-muted-foreground">
        <Skeleton class="h-4 w-64" />
      </div>
      <div v-else-if="analysis?.source" class="text-sm text-muted-foreground">
        Analisando
        <span class="font-medium text-foreground">{{ analysis.source.name }}</span>
        ({{ analysis.source.type === "segment" ? "segmento" : "tag" }})
      </div>

      <!-- KPIs -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <template v-if="isLoading">
          <Card v-for="n in 10" :key="`kpi-skel-${n}`">
            <CardHeader class="pb-2"><Skeleton class="h-4 w-2/3" /></CardHeader>
            <CardContent>
              <Skeleton class="h-8 w-1/2 mb-2" />
              <Skeleton class="h-3 w-3/4" />
            </CardContent>
          </Card>
        </template>
        <template v-else>
          <Card v-for="card in kpiCards" :key="card.title">
            <CardHeader class="pb-2">
              <div class="flex items-start justify-between gap-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">{{ card.title }}</CardTitle>
                <component :is="card.icon" class="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <p class="text-2xl font-bold tracking-tight">{{ card.value }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ card.hint }}</p>
            </CardContent>
          </Card>
        </template>
      </div>

      <!-- Performance -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Métricas de desempenho</h3>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <template v-if="isLoading">
            <Card v-for="n in 12" :key="`perf-skel-${n}`">
              <CardHeader class="py-3 pb-1"><Skeleton class="h-4 w-2/3" /></CardHeader>
              <CardContent class="pb-3">
                <Skeleton class="h-6 w-1/2 mb-2" />
                <Skeleton class="h-3 w-3/4" />
              </CardContent>
            </Card>
          </template>
          <template v-else>
            <Card v-for="card in performanceCards" :key="card.title">
              <CardHeader class="py-3 pb-1">
                <CardTitle class="text-sm font-medium text-muted-foreground">{{ card.title }}</CardTitle>
              </CardHeader>
              <CardContent class="pb-3">
                <p class="text-xl font-semibold">{{ card.value }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ card.hint }}</p>
              </CardContent>
            </Card>
          </template>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Segmentação por Depósitos</CardTitle>
            <CardDescription>Distribuição de jogadores por quantidade de depósitos no período.</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton v-if="isLoading" class="h-80 w-full" />
            <apexchart
              v-else-if="pieSeries.length"
              type="donut"
              height="320"
              :options="pieOptions"
              :series="pieSeries"
            />
            <p v-else class="text-sm text-muted-foreground py-16 text-center">Sem dados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Segmento de Depósito</CardTitle>
            <CardDescription>Volume depositado por faixa de frequência.</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton v-if="isLoading" class="h-80 w-full" />
            <apexchart
              v-else-if="revenueBarSeries[0]?.data?.length"
              type="bar"
              height="320"
              :options="revenueBarOptions"
              :series="revenueBarSeries"
            />
            <p v-else class="text-sm text-muted-foreground py-16 text-center">Sem dados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>Do cadastro no grupo até múltiplos depósitos no período.</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton v-if="isLoading" class="h-80 w-full" />
            <apexchart
              v-else-if="funnelSeries[0]?.data?.length"
              type="bar"
              height="320"
              :options="funnelOptions"
              :series="funnelSeries"
            />
            <p v-else class="text-sm text-muted-foreground py-16 text-center">Sem dados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Retenção</CardTitle>
            <CardDescription>% dos depositantes com atividade recente (login ou depósito).</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="isLoading" class="grid grid-cols-3 gap-4">
              <Skeleton v-for="n in 3" :key="`ret-skel-${n}`" class="h-24 w-full" />
            </div>
            <div v-else class="grid grid-cols-3 gap-4 py-6">
              <div class="rounded-lg border p-4 text-center">
                <p class="text-xs text-muted-foreground mb-2">7 Dias</p>
                <p class="text-3xl font-bold">{{ numberLocale(analysis?.retention?.d7 ?? 0) }}%</p>
              </div>
              <div class="rounded-lg border p-4 text-center">
                <p class="text-xs text-muted-foreground mb-2">14 Dias</p>
                <p class="text-3xl font-bold">{{ numberLocale(analysis?.retention?.d14 ?? 0) }}%</p>
              </div>
              <div class="rounded-lg border p-4 text-center">
                <p class="text-xs text-muted-foreground mb-2">30 Dias</p>
                <p class="text-3xl font-bold">{{ numberLocale(analysis?.retention?.d30 ?? 0) }}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade de Jogadores</CardTitle>
          <CardDescription>Logins únicos e depositantes por dia no período.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="isLoading" class="h-96 w-full" />
          <apexchart
            v-else-if="activitySeries[0]?.data?.length"
            type="area"
            height="360"
            :options="activityOptions"
            :series="activitySeries"
          />
          <p v-else class="text-sm text-muted-foreground py-16 text-center">Sem dados.</p>
        </CardContent>
      </Card>

      <p v-if="hasLoadedOnce && analysis?.meta?.membership" class="text-xs text-muted-foreground">
        {{ analysis.meta.membership }}
      </p>
    </template>
  </div>
</template>
