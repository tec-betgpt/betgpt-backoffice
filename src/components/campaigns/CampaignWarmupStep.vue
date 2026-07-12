<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Warmup</h3>
      <p class="text-sm text-muted-foreground">
        Warmup controla o aumento gradual do volume de envios. Ele serve para evitar que uma campanha comece enviando para toda a base de uma vez. O limite inicial define o primeiro volume, o incremento define como o volume cresce, e o limite máximo define até onde esse crescimento pode chegar.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
      <Switch v-model:checked="model.is_enabled" :disabled="readonly" />
      Ativar warmup
    </label>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="space-y-2">
        <Label>Limite inicial</Label>
        <Input v-model.number="model.initial_limit" type="number" min="0" :disabled="readonly || !model.is_enabled" />
      </div>
      <div class="space-y-2">
        <Label>Incremento</Label>
        <Input v-model.number="model.increment_amount" type="number" min="0" :disabled="readonly || !model.is_enabled" />
      </div>
      <div class="space-y-2">
        <Label>Tipo de incremento</Label>
        <select v-model="model.increment_type" :disabled="readonly || !model.is_enabled" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="fixed">Fixo</option>
          <option value="percentage">Percentual</option>
        </select>
      </div>
      <div class="space-y-2">
        <Label>Unidade do intervalo</Label>
        <select v-model="model.interval_unit" :disabled="readonly || !model.is_enabled" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="hour">Hora</option>
          <option value="day">Dia</option>
        </select>
      </div>
      <div class="space-y-2">
        <Label>Valor do intervalo</Label>
        <Input v-model.number="model.interval_value" type="number" min="1" :disabled="readonly || !model.is_enabled" />
      </div>
      <div class="space-y-2">
        <Label>Limite máximo</Label>
        <Input v-model.number="model.max_limit" type="number" min="0" :disabled="readonly || !model.is_enabled" />
      </div>
    </div>

    <CampaignJsonField v-model="model.metadata" label="Metadata" :readonly="readonly || !model.is_enabled" />

    <Button v-if="onSave" variant="outline" :disabled="readonly || loading" @click="onSave">
      {{ loading ? "Salvando..." : "Salvar etapa" }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import CampaignJsonField from "./CampaignJsonField.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignValidationItem, CampaignWarmupPolicyPayload } from "@/contracts/campaigns";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignWarmupPolicyPayload>({ required: true });
</script>
