<template>
  <Card>
    <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1.5">
        <CardTitle>Conversões</CardTitle>
        <CardDescription>
          Jogadores que receberam a campanha e, em até {{ windowLabel }} depois do envio, fizeram login ou depósito,
          segundo os postbacks da casa.
        </CardDescription>
      </div>
      <div class="flex items-center gap-2">
        <Label class="text-xs text-nowrap text-muted-foreground">Janela</Label>
        <Select v-model="windowHours" @update:model-value="load">
          <SelectTrigger class="h-9 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in windowOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

      <div v-if="loading && !data" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Skeleton v-for="item in 5" :key="item" class="h-24 w-full" />
      </div>

      <template v-else-if="data">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div v-for="item in kpis" :key="item.label" class="rounded-md border border-border p-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm text-muted-foreground">{{ item.label }}</span>
              <GlossaryTooltipComponent :description="item.tooltip" class="-my-2 -mr-2" />
            </div>
            <div class="text-2xl font-bold">{{ item.value }}</div>
            <div v-if="item.hint" class="text-xs text-muted-foreground">{{ item.hint }}</div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div v-for="item in rates" :key="item.label" class="space-y-2 rounded-md border border-border p-3">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-sm text-muted-foreground">{{ item.label }}</span>
              <span class="text-lg font-bold">{{ formatPercent(item.value) }}</span>
            </div>
            <Progress :model-value="Math.min(item.value, 100)" :class="item.barClass" />
            <p class="text-xs text-muted-foreground">{{ item.hint }}</p>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
