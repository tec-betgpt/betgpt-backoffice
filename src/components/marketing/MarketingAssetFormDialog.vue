<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ asset ? `Editar template de ${channelLabel}` : `Criar template de ${channelLabel}` }}</DialogTitle>
        <DialogDescription>
          Configure o conteúdo reutilizável do canal {{ channelLabel }}.
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="errorMessage" variant="destructive">
        <AlertTitle>Não foi possível salvar</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <form class="space-y-5" @submit.prevent="save">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2 md:col-span-2">
            <Label for="asset-name">Nome</Label>
            <Input id="asset-name" v-model="form.name" maxlength="255" placeholder="Ex.: Boas-vindas" />
          </div>

          <div v-if="channel === 'email'" class="space-y-2 md:col-span-2">
            <Label for="asset-subject">Assunto</Label>
            <Input id="asset-subject" v-model="form.subject" maxlength="255" placeholder="Assunto do e-mail" />
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="asset-body">Conteúdo</Label>
            <Textarea
              id="asset-body"
              v-model="form.body"
              rows="8"
              :maxlength="channel === 'sms' ? 1530 : undefined"
              :placeholder="channel === 'email' ? '<p>Olá, {{name}}!</p>' : 'Digite o conteúdo do template'"
            />
            <p v-if="channel === 'sms'" class="text-xs text-muted-foreground">{{ form.body.length }} / 1530 caracteres</p>
          </div>

          <div class="space-y-2">
            <Label for="asset-locale">Idioma</Label>
            <Input id="asset-locale" v-model="form.locale" maxlength="20" placeholder="pt-BR" />
          </div>

          <div v-if="channel === 'sms'" class="space-y-2">
            <Label for="asset-sender">Remetente</Label>
            <Input id="asset-sender" v-model="form.sender" maxlength="32" placeholder="Opcional" />
          </div>

          <template v-if="channel === 'email'">
            <div class="space-y-2">
              <Label for="asset-from-name">Nome do remetente</Label>
              <Input id="asset-from-name" v-model="form.fromName" maxlength="255" />
            </div>
            <div class="space-y-2">
              <Label for="asset-from-address">E-mail do remetente</Label>
              <Input id="asset-from-address" v-model="form.fromAddress" type="email" />
            </div>
            <div class="space-y-2 md:col-span-2">
              <Label for="asset-reply-to">Responder para</Label>
              <Input id="asset-reply-to" v-model="form.replyTo" type="email" />
            </div>
          </template>

          <template v-if="['webpush', 'inbox', 'popup'].includes(channel)">
            <div class="space-y-2" :class="channel === 'webpush' ? '' : 'md:col-span-2'">
              <Label for="asset-title">Título {{ channel === 'webpush' ? '' : '(opcional)' }}</Label>
              <Input id="asset-title" v-model="form.title" maxlength="255" />
            </div>
            <div v-if="channel === 'webpush'" class="space-y-2">
              <Label for="asset-icon">URL do ícone</Label>
              <Input id="asset-icon" v-model="form.icon" type="url" placeholder="https://..." />
            </div>
            <div class="space-y-2 md:col-span-2">
              <Label for="asset-action-url">URL da ação</Label>
              <Input id="asset-action-url" v-model="form.actionUrl" type="url" placeholder="https://..." />
            </div>
          </template>

          <template v-if="channel === 'callcenter'">
            <div class="space-y-2">
              <Label for="asset-caller-id">Caller ID</Label>
              <Input id="asset-caller-id" v-model="form.callerId" maxlength="32" />
            </div>
            <div class="space-y-2">
              <Label for="asset-voice">Voz</Label>
              <Input id="asset-voice" v-model="form.voice" maxlength="100" placeholder="pt-BR" />
            </div>
          </template>

          <template v-if="['whatsapp', 'rcs'].includes(channel)">
            <div class="space-y-2">
              <Label for="asset-media-type">Tipo de mídia</Label>
              <select id="asset-media-type" v-model="form.mediaType" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Sem mídia</option>
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
                <option value="document">Documento</option>
                <option value="audio">Áudio</option>
              </select>
            </div>
            <div class="space-y-2">
              <Label for="asset-media-url">URL da mídia</Label>
              <Input id="asset-media-url" v-model="form.mediaUrl" type="url" placeholder="https://..." />
            </div>
          </template>

          <div class="space-y-2 md:col-span-2">
            <Label for="asset-variables">Variáveis (JSON opcional)</Label>
            <Textarea id="asset-variables" v-model="form.variables" rows="3" placeholder='{"name":"Nome do jogador"}' />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="asset-metadata">Metadados (JSON opcional)</Label>
            <Textarea id="asset-metadata" v-model="form.metadata" rows="3" placeholder='{"origem":"backoffice"}' />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isSaving" @click="emit('update:open', false)">Cancelar</Button>
          <Button type="submit" :disabled="isSaving || !projectId">
            {{ isSaving ? "Salvando..." : asset ? "Salvar alterações" : "Criar template" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "vue-sonner";
import {
  MARKETING_CHANNEL_LABELS,
  type MarketingAsset,
  type MarketingChannel,
} from "@/contracts/marketingAssets";
import { createMarketingAsset, updateMarketingAsset } from "@/services/marketingAssets";
import {
  buildAssetPayload,
  createEmptyAssetForm,
  fillAssetForm,
  validateAssetForm,
} from "./marketingAssetForm";

const props = withDefaults(defineProps<{
  open: boolean;
  channel: MarketingChannel;
  projectId: number | null;
  asset?: MarketingAsset | null;
}>(), { asset: null });

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "saved", asset: MarketingAsset): void;
}>();

const form = reactive(createEmptyAssetForm());
const isSaving = ref(false);
const errorMessage = ref("");
const channelLabel = computed(() => MARKETING_CHANNEL_LABELS[props.channel]);

watch(
  () => [props.open, props.asset] as const,
  ([isOpen]) => {
    if (!isOpen) return;
    Object.assign(form, props.asset ? fillAssetForm(props.asset) : createEmptyAssetForm());
    errorMessage.value = "";
  },
  { immediate: true },
);

async function save() {
  if (!props.projectId) return;
  const validationError = validateAssetForm(form, props.channel);
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }
  errorMessage.value = "";

  isSaving.value = true;
  try {
    const payload = buildAssetPayload(form, props.channel, props.projectId);
    const changes = Object.fromEntries(
      Object.entries(payload).filter(([key]) => !["project_id", "channel"].includes(key)),
    );
    const saved = props.asset
      ? await updateMarketingAsset(props.asset.id, changes)
      : await createMarketingAsset(payload);
    toast.success("Sucesso", { description: "Template salvo com sucesso." });
    emit("saved", saved);
    emit("update:open", false);
  } catch (error: any) {
    const response = error?.response?.data;
    const firstError = response?.errors ? Object.values(response.errors).flat()[0] : null;
    errorMessage.value = firstError || response?.message || error?.message || "Falha ao salvar o template.";
  } finally {
    isSaving.value = false;
  }
}
</script>
