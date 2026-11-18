<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  WebhookInspectorEndpoint,
  WebhookInspectorEndpointPayload,
} from "@/services/webhookInspector";

const props = withDefaults(
  defineProps<{
    open: boolean;
    submitting: boolean;
    initial?: WebhookInspectorEndpoint | null;
  }>(),
  { initial: null },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [payload: WebhookInspectorEndpointPayload];
}>();

const CONTENT_TYPES = [
  "application/json",
  "text/plain",
  "text/html",
  "application/xml",
  "application/x-www-form-urlencoded",
];

const name = ref("");
const description = ref("");
const isActive = ref(true);
const corsEnabled = ref(true);
const responseStatus = ref<number | string>(200);
const responseContentType = ref("application/json");
const responseBody = ref('{"success":true}');
const attempted = ref(false);

const isEdit = computed(() => props.initial !== null);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const initial = props.initial;
    name.value = initial?.name ?? "";
    description.value = initial?.description ?? "";
    isActive.value = initial?.is_active ?? true;
    corsEnabled.value = initial?.cors_enabled ?? true;
    responseStatus.value = initial?.response_status ?? 200;
    responseContentType.value = initial?.response_content_type ?? "application/json";
    responseBody.value = initial ? initial.response_body ?? "" : '{"success":true}';
    attempted.value = false;
  },
);

const nameError = computed(() =>
  name.value.trim().length === 0 ? "Informe um nome." : null,
);

const statusError = computed(() => {
  const value = Number(responseStatus.value);
  return Number.isInteger(value) && value >= 200 && value <= 599
    ? null
    : "Use um status entre 200 e 599.";
});

const contentTypeError = computed(() =>
  /^[\w.+-]+\/[\w.+-]+(\s*;\s*[\w.+-]+=[\w.+"-]+)*$/.test(responseContentType.value.trim())
    ? null
    : "Content-Type inválido.",
);

const jsonWarning = computed(() => {
  if (!responseContentType.value.includes("json") || !responseBody.value.trim()) return null;
  try {
    JSON.parse(responseBody.value);
    return null;
  } catch {
    return "O corpo não é um JSON válido (será enviado como está).";
  }
});

function submit() {
  attempted.value = true;
  if (nameError.value || statusError.value || contentTypeError.value || props.submitting) return;

  emit("submit", {
    name: name.value.trim(),
    description: description.value.trim() || null,
    is_active: isActive.value,
    cors_enabled: corsEnabled.value,
    response_status: Number(responseStatus.value),
    response_content_type: responseContentType.value.trim(),
    response_body: responseBody.value === "" ? null : responseBody.value,
  });
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? "Editar endpoint" : "Novo endpoint" }}</DialogTitle>
        <DialogDescription>
          Cada endpoint gera uma URL que guarda tudo o que receber. Configure também a resposta
          que quem chamar vai receber.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-5" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="wi-name">Nome</Label>
          <Input
            id="wi-name"
            v-model="name"
            maxlength="120"
            placeholder="Ex.: Postback Bets88 em homologação"
          />
          <p v-if="attempted && nameError" class="text-sm text-destructive">{{ nameError }}</p>
        </div>

        <div class="space-y-2">
          <Label for="wi-description">Descrição (opcional)</Label>
          <Textarea
            id="wi-description"
            v-model="description"
            rows="2"
            maxlength="1000"
            placeholder="Para que serve, quem está usando..."
          />
        </div>

        <div class="flex flex-wrap gap-6">
          <label class="flex items-center gap-2 text-sm">
            <Switch v-model:checked="isActive" />
            Recebendo requisições
          </label>
          <label class="flex items-center gap-2 text-sm">
            <Switch v-model:checked="corsEnabled" />
            Liberar CORS (chamadas pelo navegador)
          </label>
        </div>

        <div class="rounded-lg border p-4 space-y-4">
          <p class="text-sm font-medium">Resposta enviada</p>
          <div class="grid gap-4 sm:grid-cols-[120px_1fr]">
            <div class="space-y-2">
              <Label for="wi-status">Status</Label>
              <Input id="wi-status" v-model="responseStatus" type="number" min="200" max="599" />
            </div>
            <div class="space-y-2">
              <Label for="wi-content-type">Content-Type</Label>
              <Input
                id="wi-content-type"
                v-model="responseContentType"
                list="wi-content-types"
                maxlength="150"
              />
              <datalist id="wi-content-types">
                <option v-for="type in CONTENT_TYPES" :key="type" :value="type" />
              </datalist>
            </div>
          </div>
          <p v-if="attempted && statusError" class="text-sm text-destructive">{{ statusError }}</p>
          <p v-if="attempted && contentTypeError" class="text-sm text-destructive">
            {{ contentTypeError }}
          </p>
          <div class="space-y-2">
            <Label for="wi-body">Corpo</Label>
            <Textarea
              id="wi-body"
              v-model="responseBody"
              rows="5"
              class="font-mono text-xs"
              placeholder="Vazio = resposta sem corpo"
            />
            <p v-if="jsonWarning" class="text-xs text-amber-600">{{ jsonWarning }}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="submitting" @click="emit('update:open', false)">
            Cancelar
          </Button>
          <Button type="submit" :disabled="submitting">
            {{ submitting ? "Salvando..." : isEdit ? "Salvar" : "Criar endpoint" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
