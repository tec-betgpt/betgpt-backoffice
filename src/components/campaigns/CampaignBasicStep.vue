<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Dados básicos</h3>
      <p class="text-sm text-muted-foreground">
        Esta etapa define a identidade da campanha. O projeto indica onde a campanha será criada, o nome ajuda a identificar o rascunho no painel, e o canal define que a campanha será de SMS. Nesta fase, o tipo deve ser broadcast e o canal deve ser sms.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2 md:col-span-2">
        <Label>Nome</Label>
        <Input v-model="model.name" :disabled="readonly" placeholder="Campanha SMS de retenção" />
      </div>
      <div class="space-y-2 md:col-span-2">
        <Label>Descrição</Label>
        <Textarea v-model="model.description" :disabled="readonly" placeholder="Contexto interno do rascunho" />
      </div>
      <div class="space-y-2">
        <Label>Tipo</Label>
        <Input v-model="model.type" disabled />
      </div>
      <div class="space-y-2">
        <Label>Canal</Label>
        <Input v-model="model.channel" disabled />
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
import { Textarea } from "@/components/ui/textarea";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignFormState, CampaignValidationItem } from "@/contracts/campaigns";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignFormState>({ required: true });
</script>
