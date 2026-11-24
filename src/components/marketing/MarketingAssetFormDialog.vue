<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      :class="isEmail
        ? 'flex h-[96vh] max-h-[96vh] w-[97vw] max-w-[97vw] flex-col gap-3 overflow-hidden p-4 sm:max-w-[97vw]'
        : 'max-h-[90vh] max-w-4xl overflow-y-auto'"
    >
      <DialogHeader :class="isEmail ? 'space-y-0' : ''">
        <DialogTitle class="flex items-center gap-2">
          <Mail v-if="isEmail" class="size-4 text-muted-foreground" />
          {{ asset ? `Editar template de ${channelLabel}` : `Criar template de ${channelLabel}` }}
        </DialogTitle>
        <DialogDescription :class="isEmail ? 'sr-only' : ''">Configure o conteúdo reutilizável do canal {{ channelLabel }}.</DialogDescription>
      </DialogHeader>

      <Alert v-if="errorMessage" variant="destructive" :class="isEmail ? 'py-2' : ''">
        <AlertTitle>Não foi possível salvar</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <form v-if="isEmail" class="flex min-h-0 flex-1 flex-col gap-3" @submit.prevent="save">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div class="space-y-1">
            <Label for="asset-name" class="text-xs">Nome do template</Label>
            <Input id="asset-name" v-model="form.name" class="h-8" maxlength="255" placeholder="Ex.: Boas-vindas" />
          </div>
          <div class="space-y-1">
            <Label for="asset-subject" class="text-xs">Assunto do e-mail</Label>
            <Input id="asset-subject" v-model="form.subject" class="h-8" maxlength="255" placeholder="Assunto do e-mail" />
          </div>
          <div class="space-y-1">
            <Label for="asset-from-name" class="text-xs">Nome do remetente</Label>
            <Input id="asset-from-name" v-model="form.fromName" class="h-8" maxlength="255" placeholder="Opcional" />
          </div>
          <div class="space-y-1">
            <Label for="asset-from-address" class="text-xs">E-mail do remetente</Label>
            <Input id="asset-from-address" v-model="form.fromAddress" class="h-8" type="email" placeholder="Opcional" />
          </div>
          <div class="space-y-1">
            <Label for="asset-reply-to" class="text-xs">Responder para</Label>
            <Input id="asset-reply-to" v-model="form.replyTo" class="h-8" type="email" placeholder="Opcional" />
          </div>
        </div>

        <EmailBuilderEditor
          ref="emailBuilder"
          :key="emailEditorKey"
          class="min-h-0 flex-1"
          :design="form.emailDesign"
          :html="form.body"
          @change="onEmailBuilderChange"
        />

        <DialogFooter class="items-center gap-2 sm:justify-between sm:pr-14">
          <p class="text-xs text-muted-foreground">
            Use as variáveis do jogador pelo menu "Merge Tags" do texto, ex.: <code v-pre>{{first_name}}</code>.
          </p>
          <div class="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" :disabled="isSaving" @click="openPreview">Pré-visualizar</Button>
            <Button type="button" variant="ghost" size="sm" :disabled="isSaving" @click="emit('update:open', false)">Cancelar</Button>
            <Button type="submit" size="sm" :disabled="isSaving || !projectId">
              <Check class="mr-1 size-4" />
              {{ isSaving ? "Salvando..." : asset ? "Salvar alterações" : "Criar template" }}
            </Button>
          </div>
        </DialogFooter>
      </form>

      <form v-else class="space-y-5" @submit.prevent="save">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2 md:col-span-2">
            <Label for="asset-name">Nome do template</Label>
            <Input id="asset-name" v-model="form.name" maxlength="255" placeholder="Ex.: Boas-vindas" />
          </div>

          <div v-if="['webpush', 'inbox'].includes(channel)" class="space-y-2 md:col-span-2">
            <Label for="asset-title">Título da mensagem</Label>
            <Input id="asset-title" v-model="form.title" maxlength="255" />
          </div>

          <template v-if="channel === 'webpush'">
            <div class="space-y-2 md:col-span-2">
              <Label for="asset-icon">Imagem (opcional)</Label>
              <Input id="asset-icon" v-model="form.icon" type="url" placeholder="https://..." />
            </div>
            <div class="space-y-2 md:col-span-2">
              <Label for="asset-action-url">Link</Label>
              <Input id="asset-action-url" v-model="form.actionUrl" type="url" placeholder="https://..." />
            </div>
          </template>

          <template v-if="channel === 'inbox'">
            <div class="space-y-2 md:col-span-2">
              <Label for="asset-action-url">Link (opcional)</Label>
              <Input id="asset-action-url" v-model="form.actionUrl" type="url" placeholder="https://..." />
            </div>
          </template>

          <template v-if="channel === 'whatsapp'">
            <div class="space-y-2">
              <Label for="asset-whatsapp-category">Categoria do template</Label>
              <select id="asset-whatsapp-category" v-model="form.whatsappCategory" class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Selecione</option>
                <option value="utility">Utilitário</option>
                <option value="marketing">Marketing</option>
                <option value="authentication">Autenticação</option>
              </select>
            </div>
            <div class="space-y-2">
              <Label for="asset-placeholders">Placeholders suportados</Label>
              <Input id="asset-placeholders" v-model="form.placeholders" placeholder="name, first_name, coupon" />
              <p class="text-xs text-muted-foreground">Separe os placeholders por vírgula.</p>
            </div>
          </template>

          <div v-if="['whatsapp', 'rcs'].includes(channel)" class="grid gap-4 md:col-span-2 md:grid-cols-2">
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
          </div>

          <div v-if="channel !== 'callcenter'" class="space-y-2 md:col-span-2">
            <Label for="asset-body">{{ bodyLabel }}</Label>
            <HtmlEditor v-if="usesHtmlEditor" v-model="form.body" />
            <Textarea
              v-else
              id="asset-body"
              v-model="form.body"
              rows="8"
              :maxlength="channel === 'sms' ? 1530 : undefined"
              :placeholder="channel === 'sms' ? 'Digite a mensagem SMS' : 'Digite o conteúdo do template'"
            />
            <p v-if="channel === 'sms'" class="text-xs text-muted-foreground">{{ form.body.length }} / 1530 caracteres</p>
          </div>

          <div v-if="channel === 'callcenter'" class="space-y-3 md:col-span-2">
            <Label>Arquivo de áudio</Label>
            <label
              class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-accent"
              @dragover.prevent
              @drop.prevent="onAudioDrop"
            >
              <Upload class="mb-2 size-6 text-muted-foreground" />
              <span class="text-sm font-medium">{{ form.audioName || 'Arraste o áudio ou clique para selecionar' }}</span>
              <span class="mt-1 text-xs text-muted-foreground">MP3, WAV, OGG, M4A ou AAC · até 20 MB</span>
              <input class="hidden" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac" @change="onAudioChange" />
            </label>
            <audio v-if="form.audioPreviewUrl" class="w-full" controls :src="form.audioPreviewUrl" />
            <Button v-if="form.audioPreviewUrl" type="button" variant="ghost" size="sm" @click="removeAudio">Remover áudio</Button>
          </div>

          <div v-if="channel === 'popup'" class="space-y-3 md:col-span-2">
            <div class="flex items-center justify-between">
              <Label>Botões do PopUp</Label>
              <Button type="button" variant="outline" size="sm" @click="addPopupButton">+ Adicionar botão</Button>
            </div>
            <div v-for="(button, index) in form.popupButtons" :key="index" class="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]">
              <Input v-model="button.label" placeholder="Rótulo" />
              <Input v-model="button.actionUrl" type="url" placeholder="https://..." />
              <Button type="button" variant="ghost" size="sm" @click="form.popupButtons.splice(index, 1)">Remover</Button>
            </div>
          </div>
        </div>

        <details class="rounded-md border">
          <summary class="cursor-pointer px-4 py-3 text-sm font-medium">Opções avançadas</summary>
          <div class="grid gap-4 border-t p-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="asset-locale">Idioma</Label>
              <Input id="asset-locale" v-model="form.locale" maxlength="20" placeholder="pt-BR" />
            </div>
            <div v-if="channel === 'sms'" class="space-y-2">
              <Label for="asset-sender">Remetente</Label>
              <Input id="asset-sender" v-model="form.sender" maxlength="32" placeholder="Opcional" />
            </div>
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
            <div class="space-y-2 md:col-span-2">
              <Label for="asset-variables">Variáveis (JSON opcional)</Label>
              <Textarea id="asset-variables" v-model="form.variables" rows="3" placeholder='{"name":"Nome do jogador"}' />
            </div>
            <div class="space-y-2 md:col-span-2">
              <Label for="asset-metadata">Metadados (JSON opcional)</Label>
              <Textarea id="asset-metadata" v-model="form.metadata" rows="3" placeholder='{"origem":"backoffice"}' />
            </div>
          </div>
        </details>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isSaving" @click="openPreview">Pré-visualizar</Button>
          <Button type="button" variant="ghost" :disabled="isSaving" @click="emit('update:open', false)">Cancelar</Button>
          <Button type="submit" :disabled="isSaving || !projectId">
            {{ isSaving ? "Salvando..." : asset ? "Salvar alterações" : "Criar template" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <MarketingAssetPreviewDialog v-model:open="isPreviewOpen" :asset="previewAsset" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { Check, Mail, Upload } from "lucide-vue-next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "vue-sonner";
import { MARKETING_CHANNEL_LABELS, type MarketingAsset, type MarketingChannel } from "@/contracts/marketingAssets";
import {
  createMarketingAsset,
  deleteMarketingAssetAudio,
  updateMarketingAsset,
  uploadMarketingAssetAudio,
} from "@/services/marketingAssets";
import EmailBuilderEditor from "./EmailBuilderEditor.vue";
import HtmlEditor from "./HtmlEditor.vue";
import type { EmailBuilderContent } from "./unlayer";
import MarketingAssetPreviewDialog from "./MarketingAssetPreviewDialog.vue";
import { buildAssetPayload, createEmptyAssetForm, fillAssetForm, validateAssetForm } from "./marketingAssetForm";

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
const isPreviewOpen = ref(false);
const audioFile = ref<File | null>(null);
const createdAsset = ref<MarketingAsset | null>(null);
const audioMarkedForRemoval = ref(false);
const emailBuilder = ref<InstanceType<typeof EmailBuilderEditor> | null>(null);
const emailEditorKey = ref(0);
const channelLabel = computed(() => MARKETING_CHANNEL_LABELS[props.channel]);
const isEmail = computed(() => props.channel === "email");
const usesHtmlEditor = computed(() => ["inbox", "rcs", "popup"].includes(props.channel));
const bodyLabel = computed(() => {
  if (props.channel === "sms" || props.channel === "whatsapp") return "Mensagem";
  if (props.channel === "webpush") return "Mensagem";
  return "Conteúdo HTML";
});
const previewAsset = computed<MarketingAsset>(() => {
  const payload = buildAssetPayload(form, props.channel, props.projectId || 0);
  return {
    ...(props.asset ?? {}),
    ...payload,
    id: props.asset?.id ?? 0,
    project_id: props.projectId || 0,
    payload: payload.payload ?? null,
    variables: payload.variables ?? null,
    metadata: payload.metadata ?? null,
    audio_url: form.audioPreviewUrl || null,
    created_at: props.asset?.created_at ?? null,
    updated_at: props.asset?.updated_at ?? null,
  } as MarketingAsset;
});

watch(
  () => [props.open, props.asset] as const,
  ([isOpen]) => {
    if (!isOpen) return;
    revokeLocalAudio();
    Object.assign(form, props.asset ? fillAssetForm(props.asset) : createEmptyAssetForm());
    errorMessage.value = "";
    audioFile.value = null;
    createdAsset.value = null;
    audioMarkedForRemoval.value = false;
    emailEditorKey.value += 1;
  },
  { immediate: true },
);

onBeforeUnmount(revokeLocalAudio);

function onEmailBuilderChange(content: EmailBuilderContent) {
  form.body = content.html;
  form.emailDesign = content.design;
}

async function syncEmailBuilder() {
  if (!isEmail.value) return;
  const content = await emailBuilder.value?.exportContent();
  if (content) onEmailBuilderChange(content);
}

async function openPreview() {
  await syncEmailBuilder();
  errorMessage.value = "";
  try {
    void previewAsset.value;
    isPreviewOpen.value = true;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Revise os campos antes de visualizar.";
  }
}

function addPopupButton() {
  form.popupButtons.push({ label: "", actionUrl: "" });
}

function onAudioChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) setAudioFile(file);
  input.value = "";
}

function onAudioDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0];
  if (file) setAudioFile(file);
}

function setAudioFile(file: File) {
  errorMessage.value = "";
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const allowed = ["mp3", "wav", "ogg", "m4a", "aac", "mpeg", "mp4"];
  if (!allowed.includes(extension) && !file.type.startsWith("audio/")) {
    errorMessage.value = "Selecione um arquivo de áudio válido.";
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    errorMessage.value = "O áudio deve ter no máximo 20 MB.";
    return;
  }
  revokeLocalAudio();
  audioFile.value = file;
  audioMarkedForRemoval.value = false;
  form.audioName = file.name;
  form.audioPreviewUrl = URL.createObjectURL(file);
}

function removeAudio() {
  revokeLocalAudio();
  audioFile.value = null;
  form.audioName = "";
  form.audioPreviewUrl = "";
  audioMarkedForRemoval.value = Boolean(props.asset?.audio_url);
}

function revokeLocalAudio() {
  if (form.audioPreviewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(form.audioPreviewUrl);
  }
}

async function save() {
  if (!props.projectId) return;
  await syncEmailBuilder();
  const validationError = validateAssetForm(form, props.channel);
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }
  errorMessage.value = "";
  isSaving.value = true;

  try {
    const payload = buildAssetPayload(form, props.channel, props.projectId);
    const changes = Object.fromEntries(Object.entries(payload).filter(([key]) => !["project_id", "channel"].includes(key)));
    const existing = props.asset ?? createdAsset.value;
    let saved = existing
      ? await updateMarketingAsset(existing.id, changes)
      : await createMarketingAsset(payload);
    createdAsset.value = saved;

    if (props.channel === "callcenter" && audioFile.value) {
      const result = await uploadMarketingAssetAudio(saved.id, audioFile.value);
      saved = { ...saved, audio_url: result.audio_url };
    } else if (props.channel === "callcenter" && audioMarkedForRemoval.value) {
      await deleteMarketingAssetAudio(saved.id);
      saved = { ...saved, audio_url: null };
    }

    createdAsset.value = saved;
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
