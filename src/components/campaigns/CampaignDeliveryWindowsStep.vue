<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Janelas de envio</h3>
      <p class="text-sm text-muted-foreground">
        Esta etapa define em quais dias e horários a campanha poderá enviar mensagens. Por exemplo, segunda a sexta das 10:00 às 18:00. A campanha precisa ter ao menos uma janela ativa para ser considerada tecnicamente válida.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <Button variant="outline" :disabled="readonly" @click="addWindow">Adicionar janela</Button>

    <div v-if="model.length === 0" class="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      Nenhuma janela configurada.
    </div>

    <div v-for="(window, index) in model" :key="index" class="grid gap-4 rounded-md border p-4 md:grid-cols-5">
      <div class="space-y-2">
        <Label>Dia</Label>
        <select v-model.number="window.day_of_week" :disabled="readonly" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option v-for="day in CAMPAIGN_DAY_OPTIONS" :key="day.value" :value="day.value">{{ day.label }}</option>
        </select>
      </div>
      <div class="space-y-2">
        <Label>Início</Label>
        <Input v-model="window.starts_at" type="time" :disabled="readonly" />
      </div>
      <div class="space-y-2">
        <Label>Fim</Label>
        <Input v-model="window.ends_at" type="time" :disabled="readonly" />
      </div>
      <label class="flex items-center gap-3 pt-7 text-sm">
        <Switch v-model:checked="window.is_active" :disabled="readonly" />
        Ativa
      </label>
      <div class="flex items-end justify-end">
        <Button variant="ghost" size="sm" :disabled="readonly" @click="removeWindow(index)">Remover</Button>
      </div>
    </div>

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
import CampaignValidationList from "./CampaignValidationList.vue";
import { CAMPAIGN_DAY_OPTIONS, type CampaignDeliveryWindowPayload, type CampaignValidationItem } from "@/contracts/campaigns";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignDeliveryWindowPayload[]>({ required: true });

const addWindow = () => {
  model.value.push({ day_of_week: 1, starts_at: "10:00", ends_at: "18:00", is_active: true });
};

const removeWindow = (index: number) => {
  model.value.splice(index, 1);
};
</script>
