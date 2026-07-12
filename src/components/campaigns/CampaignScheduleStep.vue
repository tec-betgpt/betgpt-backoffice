<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Agendamento</h3>
      <p class="text-sm text-muted-foreground">
        Esta etapa define quando a campanha poderá ser enviada futuramente. A data inicial indica a partir de quando o envio pode começar. A data final, quando preenchida, limita até quando a campanha pode ocorrer. O timezone garante que os horários sejam interpretados corretamente.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <Label>Tipo de agendamento</Label>
        <select v-model="model.schedule_type" :disabled="readonly" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="immediate">Imediato</option>
          <option value="scheduled">Agendado</option>
          <option value="recurring">Recorrente</option>
        </select>
      </div>
      <div class="space-y-2">
        <Label>Timezone</Label>
        <Input v-model="model.timezone" :disabled="readonly" placeholder="America/Sao_Paulo" />
      </div>
      <div class="space-y-2">
        <Label>Início</Label>
        <Input v-model="model.starts_at" type="datetime-local" :disabled="readonly" />
      </div>
      <div class="space-y-2">
        <Label>Fim</Label>
        <Input v-model="model.ends_at" type="datetime-local" :disabled="readonly" />
      </div>
      <label class="flex items-center gap-3 rounded-md border p-3 text-sm md:col-span-2">
        <Switch v-model:checked="model.respect_delivery_windows" :disabled="readonly" />
        Respeitar janelas de envio
      </label>
    </div>

    <CampaignJsonField v-model="model.metadata" label="Metadata" :readonly="readonly" />

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
import type { CampaignSchedulePayload, CampaignValidationItem } from "@/contracts/campaigns";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignSchedulePayload>({ required: true });
</script>
