<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Dados básicos</h3>
      <p class="text-sm text-muted-foreground">
        Defina a identidade da campanha. Os canais e seus assets serão selecionados na etapa Canais.
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2 md:col-span-2">
        <Label>Nome</Label>
        <Input v-model="model.name" :disabled="readonly" placeholder="Campanha de retenção" />
      </div>
      <div class="space-y-2 md:col-span-2">
        <Label>Descrição</Label>
        <Textarea v-model="model.description" :disabled="readonly" placeholder="Contexto interno do rascunho" />
      </div>
      <div class="space-y-2 md:col-span-2">
        <Label>Tipo</Label>
        <Input v-model="model.type" disabled />
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

const props = defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignFormState>({ required: true });
</script>
