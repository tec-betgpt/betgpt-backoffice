<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">{{ isEmail ? "Mensagem E-mail" : "Mensagem SMS" }}</h3>
      <p class="text-sm text-muted-foreground">
        <template v-if="isEmail">
          Defina o assunto e o corpo do e-mail. Variáveis no formato {{ variableHint }} serão substituídas por destinatário.
        </template>
        <template v-else>
          Defina o texto que será enviado por SMS. O campo mostra contagem de caracteres e segmentos. Links detectados seguem para a etapa seguinte.
        </template>
      </p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <Label>Canal</Label>
        <Input :model-value="model.channel" disabled />
      </div>
      <div class="space-y-2">
        <Label>Locale</Label>
        <Input v-model="model.locale" :disabled="readonly" />
      </div>
      <div v-if="isEmail" class="space-y-2 md:col-span-2">
        <Label>Assunto</Label>
        <Input v-model="model.subject" :disabled="readonly" placeholder="Assunto do e-mail" />
      </div>
      <div class="space-y-2 md:col-span-2">
        <Label>{{ isEmail ? "Corpo do e-mail" : "Mensagem" }}</Label>
        <Textarea
          v-model="model.body"
          :disabled="readonly"
          class="min-h-40"
          :placeholder="isEmail ? 'Digite o conteúdo do e-mail...' : 'Digite o SMS...'"
        />
        <div v-if="!isEmail" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{{ model.character_count || 0 }} caracteres</span>
          <span>{{ model.sms_segments_count || 0 }} segmento(s)</span>
        </div>
        <div v-else class="text-xs text-muted-foreground">
          {{ model.character_count || 0 }} caracteres
        </div>
      </div>
    </div>

    <div v-if="model.detected_links?.length" class="space-y-2">
      <Label>Links detectados</Label>
      <div class="flex flex-wrap gap-2">
        <Badge v-for="url in model.detected_links" :key="url" variant="outline">{{ url }}</Badge>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <CampaignJsonField v-model="metadataObject" label="Metadata" :readonly="readonly" />
      <div class="space-y-2">
        <Label>Variáveis</Label>
        <Textarea rows="4" v-model="variablesText" :disabled="readonly" placeholder="nome, bonus, saldo" @blur="commitVariables" />
      </div>
    </div>

    <Button v-if="onSave" variant="outline" :disabled="readonly || loading" @click="onSave">
      {{ loading ? "Salvando..." : "Salvar etapa" }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CampaignJsonField from "./CampaignJsonField.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignMessagePayload, CampaignValidationItem } from "@/contracts/campaigns";

defineProps<{
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>();

const model = defineModel<CampaignMessagePayload>({ required: true });
const variablesText = ref("");

const isEmail = computed(() => model.value.channel === "email");
const variableHint = "{{nome}}";

const metadataObject = computed({
  get: () => model.value.metadata,
  set: (value) => {
    model.value.metadata = value;
  },
});

const urlRegex = /(https?:\/\/[^\s]+)/gi;
const variableRegex = /\{\{\s*([\w.]+)\s*\}\}/g;

watch(
  () => model.value.body,
  (body) => {
    const text = body || "";
    model.value.character_count = text.length;
    model.value.sms_segments_count = isEmail.value
      ? 0
      : text.length === 0
        ? 0
        : Math.ceil(text.length / 160);
    model.value.detected_links = Array.from(new Set(text.match(urlRegex) || []));
    model.value.variables = Array.from(new Set([...text.matchAll(variableRegex)].map((match) => match[1])));
    variablesText.value = model.value.variables.join(", ");
  },
  { immediate: true },
);

watch(
  () => model.value.variables,
  (variables) => {
    variablesText.value = (variables || []).join(", ");
  },
  { immediate: true },
);

const commitVariables = () => {
  model.value.variables = variablesText.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};
</script>
