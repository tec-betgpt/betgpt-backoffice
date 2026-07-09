<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Configuração de público</h3>
      <p class="text-sm text-muted-foreground">
        Esta etapa define quem poderá receber a campanha e quais regras de segurança serão aplicadas. A audiência indica o grupo de contatos. A lista de proteção, opt-out e suppression evitam envio para pessoas bloqueadas, descadastradas ou temporariamente inelegíveis. Os limites diário e total controlam o volume máximo de contatos.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="grid gap-4 md:grid-cols-4">
      <div class="space-y-2">
        <Label>Audiência</Label>
        <Select v-model="selectedTargetAudienceId" :disabled="readonly || isLoadingAudiences">
          <SelectTrigger>
            <SelectValue :placeholder="isLoadingAudiences ? 'Carregando audiências...' : 'Selecione uma audiência'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="EMPTY_VALUE">Nenhuma</SelectItem>
            <SelectItem
              v-for="audience in targetAudiences"
              :key="audience.id"
              :value="String(audience.id)"
            >
              {{ audience.name }}
            </SelectItem>
          </SelectContent>
        </Select>
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
    </div>
    <div class="grid gap-4 md:grid-cols-3">
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
import { computed, onMounted, ref } from "vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import CampaignJsonField from "./CampaignJsonField.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignSingleStageConfigPayload, CampaignValidationItem } from "@/contracts/campaigns";
import TargetAudience from "@/services/targetAudience";
import {useWorkspaceStore} from "@/stores/workspace";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignSingleStageConfigPayload>({ required: true });

const EMPTY_VALUE = "__none__";
const isLoadingAudiences = ref(false);
const targetAudiences = ref<{ id: number; name: string }[]>([]);

const selectedTargetAudienceId = computed({
  get: () => (model.value.target_audience_id ? String(model.value.target_audience_id) : EMPTY_VALUE),
  set: (value: string) => {
    model.value.target_audience_id = value === EMPTY_VALUE ? null : Number(value);
  },
});

onMounted(async () => {
  isLoadingAudiences.value = true;

  try {
    targetAudiences.value = await TargetAudience.list({
      filter_id: useWorkspaceStore().activeGroupProject.id
    });
  } finally {
    isLoadingAudiences.value = false;
  }
});
</script>
