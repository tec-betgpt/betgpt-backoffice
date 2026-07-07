<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Recorrência</h3>
      <p class="text-sm text-muted-foreground">
        Esta etapa só é necessária quando o agendamento for recorrente. Ela define se a campanha se repetirá diariamente, semanalmente ou mensalmente, qual intervalo será usado e quando a repetição deve terminar.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
      <Switch v-model:checked="model.is_enabled" :disabled="readonly" />
      Ativar recorrência
    </label>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="space-y-2">
        <Label>Frequência</Label>
        <select v-model="model.frequency" :disabled="readonly || !model.is_enabled" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="daily">Diária</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select>
      </div>
      <div class="space-y-2">
        <Label>Intervalo</Label>
        <Input v-model.number="model.interval" type="number" min="1" :disabled="readonly || !model.is_enabled" />
      </div>
      <div class="space-y-2">
        <Label>Máximo de ocorrências</Label>
        <Input v-model.number="model.max_occurrences" type="number" min="1" :disabled="readonly || !model.is_enabled" />
      </div>
      <div class="space-y-2">
        <Label>Repetir até</Label>
        <Input v-model="model.repeat_until" type="date" :disabled="readonly || !model.is_enabled" />
      </div>
      <div class="space-y-2">
        <Label>Dias da semana</Label>
        <Input v-model="daysOfWeekText" :disabled="readonly || !model.is_enabled" placeholder="1,2,3,4,5" @blur="commitDaysOfWeek" />
      </div>
      <div class="space-y-2">
        <Label>Dias do mês</Label>
        <Input v-model="daysOfMonthText" :disabled="readonly || !model.is_enabled" placeholder="1,15,30" @blur="commitDaysOfMonth" />
      </div>
    </div>

    <CampaignJsonField v-model="model.metadata" label="Metadata" :readonly="readonly || !model.is_enabled" />

    <Button v-if="onSave" variant="outline" :disabled="readonly || loading" @click="onSave">
      {{ loading ? "Salvando..." : "Salvar etapa" }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import CampaignJsonField from "./CampaignJsonField.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignRecurrencePolicyPayload, CampaignValidationItem } from "@/contracts/campaigns";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignRecurrencePolicyPayload>({ required: true });
const daysOfWeekText = ref("");
const daysOfMonthText = ref("");

const serialize = (items?: number[]) => (items || []).join(",");
const parseNumbers = (value: string) =>
  value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item));

watch(
  () => model.value.days_of_week,
  (value) => {
    daysOfWeekText.value = serialize(value);
  },
  { immediate: true },
);

watch(
  () => model.value.days_of_month,
  (value) => {
    daysOfMonthText.value = serialize(value);
  },
  { immediate: true },
);

const commitDaysOfWeek = () => {
  model.value.days_of_week = parseNumbers(daysOfWeekText.value).filter((day) => day >= 0 && day <= 6);
};

const commitDaysOfMonth = () => {
  model.value.days_of_month = parseNumbers(daysOfMonthText.value).filter((day) => day >= 1 && day <= 31);
};
</script>
