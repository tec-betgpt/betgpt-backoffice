<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Configuração de público</h3>
      <p class="text-sm text-muted-foreground">
        Esta etapa define quem poderá receber a campanha e quais regras de segurança serão aplicadas. A audiência indica o grupo de contatos. A lista de proteção, opt-out e suppression evitam envio para pessoas bloqueadas, descadastradas ou temporariamente inelegíveis. Os limites diário e total controlam o volume máximo de contatos.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="grid gap-4 md:grid-cols-3">
      <div class="space-y-2">
        <Label>Audiência</Label>
        <Input v-model.number="model.target_audience_id" type="number" min="1" :disabled="readonly" />
      </div>
      <div class="space-y-2">
        <Label>Modo da audiência</Label>
        <select v-model="model.audience_mode" :disabled="readonly" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="none">Nenhuma</option>
          <option value="fixed">Fixa</option>
          <option value="dynamic">Dinâmica</option>
        </select>
      </div>
      <div class="space-y-2">
        <Label>Limite diário</Label>
        <Input v-model.number="model.daily_recipient_cap" type="number" min="0" :disabled="readonly" />
      </div>
      <div class="space-y-2">
        <Label>Limite total</Label>
        <Input v-model.number="model.total_recipient_cap" type="number" min="0" :disabled="readonly" />
      </div>
      <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
        <Switch v-model:checked="model.apply_protection_list" :disabled="readonly" />
        Lista de proteção
      </label>
      <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
        <Switch v-model:checked="model.apply_opt_out" :disabled="readonly" />
        Opt-out
      </label>
      <label class="flex items-center gap-3 rounded-md border p-3 text-sm">
        <Switch v-model:checked="model.apply_suppression" :disabled="readonly" />
        Suppression
      </label>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <CampaignJsonField v-model="model.eligibility_rules" label="Regras de elegibilidade" :readonly="readonly" />
      <CampaignJsonField v-model="model.metadata" label="Metadata" :readonly="readonly" />
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
import CampaignJsonField from "./CampaignJsonField.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignSingleStageConfigPayload, CampaignValidationItem } from "@/contracts/campaigns";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignSingleStageConfigPayload>({ required: true });
</script>
