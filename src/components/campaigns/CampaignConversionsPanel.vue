<template>
  <div class="rounded-lg border bg-card shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
      <div class="flex min-w-0 items-center gap-2">
        <TrendingUp class="size-4 text-violet-500" />
        <h3 class="text-sm font-semibold">Conversões</h3>
        <GlossaryTooltipComponent
          :description="`Jogadores que receberam a campanha e, em até ${windowLabel} depois do envio, fizeram login ou depósito, segundo os postbacks da casa.`"
          class="-my-2"
        />
      </div>
      <div class="flex items-center gap-2">
        <Label class="text-nowrap text-xs text-muted-foreground">Janela</Label>
        <Select v-model="windowHours" @update:model-value="load">
          <SelectTrigger class="h-7 w-[110px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in windowOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="p-3">
      <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

      <div v-if="loading && !data" class="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <Skeleton v-for="item in 8" :key="item" class="h-16 w-full" />
      </div>

      <div v-else-if="data" class="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <div
          v-for="item in kpis"
          :key="item.label"
          class="rounded-md border border-border/50 bg-muted/15 px-3 py-2 dark:bg-muted/40"
          :title="item.tooltip"
        >
          <div class="truncate text-xs text-muted-foreground">{{ item.label }}</div>
          <div class="text-lg font-bold tabular-nums">{{ item.value }}</div>
          <div class="truncate text-[11px] text-muted-foreground">{{ item.hint || "&nbsp;" }}</div>
        </div>
        <div
          v-for="item in rates"
          :key="item.label"
          class="space-y-1 rounded-md border border-border/50 bg-muted/15 px-3 py-2 dark:bg-muted/40"
          :title="item.hint"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="truncate text-xs text-muted-foreground">{{ item.label }}</span>
          </div>
          <div class="text-lg font-bold tabular-nums">{{ formatPercent(item.value) }}</div>
          <Progress :model-value="Math.min(item.value, 100)" class="h-1" :class="item.barClass" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { TrendingUp } from "lucide-vue-next";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import GlossaryTooltipComponent from "@/components/custom/GlossaryTooltipComponent.vue";
import type { CampaignConversions } from "@/contracts/campaigns";
import { getCampaignConversions } from "@/services/campaigns";

const props = defineProps<{
  campaignId: number;
}>();

const windowOptions = [
  { value: "1", label: "1 hora" },
  { value: "6", label: "6 horas" },
  { value: "24", label: "24 horas" },
  { value: "72", label: "3 dias" },
  { value: "168", label: "7 dias" },
];

const data = ref<CampaignConversions | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const windowHours = ref("24");

const windowLabel = computed(
  () => windowOptions.find((option) => option.value === windowHours.value)?.label ?? "24 horas",
);

const kpis = computed(() => {
  const totals = data.value?.totals;
  if (!totals) return [];

  return [
    {
      label: "Impactados",
      value: formatCount(totals.reached),
      hint: "",
      tooltip: "Jogadores que receberam ao menos uma mensagem da campanha.",
    },
    {
      label: "Login",
      value: formatCount(totals.logins),
      hint: `${formatPercent(totals.login_rate)} dos impactados`,
      tooltip: "Jogadores que fizeram login na casa dentro da janela depois de receber a mensagem.",
    },
    {
      label: "Entrada gerada",
      value: formatCount(totals.deposits_generated),
      hint: formatMoney(totals.deposits_generated_value),
      tooltip: "Jogadores que geraram um Pix de depósito dentro da janela.",
    },
    {
      label: "Entrada aprovada",
      value: formatCount(totals.deposits_approved),
      hint: formatMoney(totals.deposits_approved_value),
      tooltip: "Jogadores com depósito aprovado dentro da janela.",
    },
    {
      label: "Dep. abandonados",
      value: formatCount(totals.deposits_abandoned),
      hint: "",
      tooltip: "Jogadores que geraram um Pix e não tiveram nenhum depósito aprovado dentro da janela.",
    },
  ];
});

const rates = computed(() => {
  const totals = data.value?.totals;
  if (!totals) return [];

  return [
    {
      label: "Conversão",
      value: totals.conversion_rate,
      hint: "Entradas aprovadas sobre os impactados",
      barClass: "",
    },
    {
      label: "Taxa de aprovação",
      value: totals.approval_rate,
      hint: "Entradas geradas que foram pagas",
      barClass: "bg-emerald-500/20 [&>*]:!bg-emerald-500",
    },
    {
      label: "Taxa de abandono",
      value: totals.abandonment_rate,
      hint: "Entradas geradas que não foram pagas",
      barClass: "bg-amber-500/20 [&>*]:!bg-amber-500",
    },
  ];
});

onMounted(load);

async function load() {
  loading.value = true;
  errorMessage.value = "";

  try {
    data.value = await getCampaignConversions(props.campaignId, Number(windowHours.value));
  } catch (error) {
    const response = (error as { response?: { data?: { message?: string } } })?.response;
    errorMessage.value = response?.data?.message || "Não foi possível carregar as conversões.";
  } finally {
    loading.value = false;
  }
}

defineExpose({ refresh: load });

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
</script>
