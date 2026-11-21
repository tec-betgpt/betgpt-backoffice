<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] max-w-4xl overflow-y-auto">
      <template v-if="asset">
        <DialogHeader>
          <DialogTitle>{{ asset.name }}</DialogTitle>
          <DialogDescription>{{ asset.subject || `Template de ${channelLabel}` }}</DialogDescription>
        </DialogHeader>

        <iframe
          v-if="['email', 'inbox', 'rcs', 'popup'].includes(asset.channel)"
          class="h-[500px] w-full rounded-md border bg-white"
          sandbox=""
          :srcdoc="asset.body || '<p>Sem conteúdo</p>'"
        />

        <div v-else-if="asset.channel === 'webpush'" class="mx-auto max-w-md rounded-xl border bg-background p-5 shadow-sm">
          <div class="flex gap-4">
            <img v-if="payload.icon" :src="String(payload.icon)" alt="Imagem do Webpush" class="size-14 rounded-md object-cover" />
            <div class="min-w-0">
              <h3 class="font-semibold">{{ payload.title || 'Sem título' }}</h3>
              <p class="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{{ asset.body }}</p>
              <a v-if="payload.action_url" :href="String(payload.action_url)" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-xs text-primary underline">Abrir link</a>
            </div>
          </div>
        </div>

        <div v-else-if="['sms', 'whatsapp'].includes(asset.channel)" class="mx-auto max-w-lg space-y-3 rounded-xl border bg-muted/30 p-5">
          <div v-if="asset.channel === 'whatsapp'" class="flex flex-wrap items-center gap-2">
            <Badge v-if="payload.category" variant="secondary">{{ payload.category }}</Badge>
            <Badge v-for="placeholder in placeholders" :key="String(placeholder)" variant="outline">{{ placeholder }}</Badge>
          </div>
          <div class="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm shadow-sm">{{ asset.body }}</div>
        </div>

        <div v-else-if="asset.channel === 'callcenter'" class="mx-auto max-w-xl rounded-xl border p-5">
          <audio v-if="audioUrl" class="w-full" controls :src="audioUrl" />
          <p v-else class="text-center text-sm text-muted-foreground">Nenhum áudio disponível para este template.</p>
        </div>

        <div v-if="mediaUrl" class="rounded-md border p-3">
          <img v-if="mediaType === 'image'" :src="mediaUrl" alt="Mídia do template" class="max-h-72 rounded-md object-contain" />
          <video v-else-if="mediaType === 'video'" class="max-h-72 w-full" controls :src="mediaUrl" />
          <audio v-else-if="mediaType === 'audio'" class="w-full" controls :src="mediaUrl" />
          <a v-else :href="mediaUrl" target="_blank" rel="noopener noreferrer" class="text-sm text-primary underline">Abrir mídia</a>
        </div>

        <div v-if="asset.channel === 'popup' && popupButtons.length" class="flex flex-wrap justify-end gap-2">
          <Button v-for="(button, index) in popupButtons" :key="index" variant="outline" size="sm">
            {{ button.label || `Botão ${index + 1}` }}
          </Button>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MARKETING_CHANNEL_LABELS, type MarketingAsset } from "@/contracts/marketingAssets";

const props = withDefaults(defineProps<{
  open: boolean;
  asset: MarketingAsset | null;
}>(), { asset: null });
const emit = defineEmits<{ (event: "update:open", value: boolean): void }>();

const channelLabel = computed(() => props.asset ? MARKETING_CHANNEL_LABELS[props.asset.channel] : "");
const payload = computed<Record<string, any>>(() => (props.asset?.payload ?? {}) as Record<string, any>);
const placeholders = computed(() => Array.isArray(payload.value.placeholders) ? payload.value.placeholders : []);
const mediaUrl = computed(() => typeof payload.value.media?.url === "string" ? payload.value.media.url : null);
const mediaType = computed(() => payload.value.media?.type ?? null);
const audioUrl = computed(() => props.asset?.audio_url || payload.value.audio?.url || null);
const popupButtons = computed(() => Array.isArray(payload.value.buttons) ? payload.value.buttons : []);
</script>
