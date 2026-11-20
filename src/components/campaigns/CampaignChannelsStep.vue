<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-base font-semibold">Canais</h3>
      <p class="mt-1 text-sm text-muted-foreground">Selecione os canais que deseja utilizar na campanha.</p>
    </div>

    <CampaignValidationList :errors="errors" :warnings="warnings" />

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="option in visibleChannelOptions"
        :key="option.value"
        type="button"
        :disabled="readonly"
        :aria-pressed="isSelected(option.value)"
        class="relative flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border bg-background p-5 text-sm font-medium shadow-sm transition-colors hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        :class="isSelected(option.value) ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'bg-background'"
        @click="toggleChannel(option.value)"
      >
        <component :is="channelIcon(option.value)" class="size-8" stroke-width="1.8" />
        {{ channelLabel(option.value) }}
        <Check v-if="isSelected(option.value)" class="absolute right-2 top-2 size-4" />
      </button>
    </div>

    <Alert v-if="summaryError" variant="destructive"><AlertDescription>{{ summaryError }}</AlertDescription></Alert>
       <Card v-for="channel in selectedChannels" :key="channel" class="overflow-hidden">
      <CardHeader class="pb-4">
        <div class="flex items-center gap-2">
          <component :is="channelIcon(channel)" class="size-5 text-muted-foreground" />
          <CardTitle class="text-base">{{ channelLabel(channel) }}</CardTitle>
          <Badge v-if="messageFor(channel)?.asset_id" variant="secondary">Asset</Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <Select
            :model-value="messageFor(channel)?.asset_id ? String(messageFor(channel)?.asset_id) : ''"
            :disabled="readonly || summaryLoading || selectingChannel === channel"
            @update:modelValue="selectAsset(channel, $event)"
          >
            <SelectTrigger>
              <SelectValue :placeholder="summaryLoading ? 'Carregando assets...' : 'Selecionar asset existente'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="asset in summary?.[channel] || []" :key="asset.id" :value="String(asset.id)">
                {{ asset.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" :disabled="readonly || !projectId" @click="openCreate(channel)">
            + Criar {{ channelLabel(channel) }}
          </Button>
        </div>

        <p v-if="selectingChannel === channel" class="text-xs text-muted-foreground">Carregando conteúdo do asset...</p>
        <Alert v-if="messageFor(channel) && !messageFor(channel)?.asset_id">
          <AlertDescription>Este rascunho usa conteúdo inline legado. Ele será preservado até você selecionar um asset.</AlertDescription>
        </Alert>

        <details v-if="messageFor(channel)?.body" class="rounded-md border p-3 text-sm">
          <summary class="cursor-pointer font-medium">
            {{ selectedAssetName(channel) || 'Pré-visualizar conteúdo' }}
          </summary>
          <p v-if="messageFor(channel)?.subject" class="mt-3 text-muted-foreground">Assunto: {{ messageFor(channel)?.subject }}</p>
          <pre class="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-muted-foreground">{{ bodyPreview(channel) }}</pre>
        </details>
      </CardContent>
    </Card>

    <MarketingAssetFormDialog
      v-model:open="isCreateOpen"
      :channel="creatingChannel"
      :project-id="projectId"
      @saved="assetCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Component } from "vue";
import {
  Bell,
  Check,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquareText,
  PanelsTopLeft,
  Mic,
  Radio,
} from "lucide-vue-next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MarketingAssetFormDialog from "@/components/marketing/MarketingAssetFormDialog.vue";
import CampaignValidationList from "./CampaignValidationList.vue";
import type { CampaignChannel, CampaignMessagePayload, CampaignValidationItem } from "@/contracts/campaigns";
import {
  MARKETING_CHANNEL_LABELS,
  MARKETING_CHANNEL_OPTIONS,
  type MarketingAsset,
  type MarketingAssetSummary,
} from "@/contracts/marketingAssets";
import { getMarketingAsset, getMarketingAssetSummary } from "@/services/marketingAssets";
import { applyAssetToMessage, createChannelMessage } from "./campaignChannels";

const props = withDefaults(defineProps<{
  projectId: number | null;
  errors?: CampaignValidationItem[];
  warnings?: CampaignValidationItem[];
  loading?: boolean;
  readonly?: boolean;
  onSave?: () => void | Promise<void>;
}>(), { errors: () => [], warnings: () => [], loading: false, readonly: false });

const model = defineModel<CampaignMessagePayload[]>({ required: true });
const emit = defineEmits<{ (event: "change"): void }>();
const summary = ref<MarketingAssetSummary | null>(null);
const summaryLoading = ref(false);
const summaryError = ref("");
const selectingChannel = ref<CampaignChannel | null>(null);
const creatingChannel = ref<CampaignChannel>("sms");
const isCreateOpen = ref(false);
const channelOptions = MARKETING_CHANNEL_OPTIONS;
const icons: Record<CampaignChannel, Component> = {
  email: Mail,
  inbox: Inbox,
  webpush: Bell,
  sms: MessageSquareText,
  popup: PanelsTopLeft,
  callcenter: Mic,
  whatsapp: MessageCircle,
  rcs: Radio,
};

const visibleChannelOptions = computed(() =>
  channelOptions.filter((option) => option.value !== "rcs" || isSelected("rcs")),
);
const selectedChannels = computed(() =>
  visibleChannelOptions.value.map((option) => option.value).filter((channel) => isSelected(channel)),
);

watch(() => props.projectId, loadSummary, { immediate: true });

async function loadSummary() {
  summary.value = null;
  summaryError.value = "";
  if (!props.projectId) return;
  summaryLoading.value = true;
  try {
    summary.value = await getMarketingAssetSummary(props.projectId);
  } catch (error: any) {
    summaryError.value = error?.response?.data?.message || error?.message || "Não foi possível carregar os assets.";
  } finally {
    summaryLoading.value = false;
  }
}

function isSelected(channel: CampaignChannel) {
  return model.value.some((message) => message.channel === channel);
}

function messageFor(channel: CampaignChannel) {
  return model.value.find((message) => message.channel === channel);
}

function toggleChannel(channel: CampaignChannel) {
  const index = model.value.findIndex((message) => message.channel === channel);
  if (index >= 0) {
    model.value.splice(index, 1);
  } else {
    model.value.push(createChannelMessage(channel));
  }
  emit("change");
}

async function selectAsset(channel: CampaignChannel, value: unknown) {
  const assetId = Number(value);
  if (!assetId || props.readonly) return;
  selectingChannel.value = channel;
  summaryError.value = "";
  try {
    const asset = await getMarketingAsset(assetId);
    applyAsset(channel, asset);
  } catch (error: any) {
    summaryError.value = error?.response?.data?.message || error?.message || "Não foi possível carregar o asset.";
  } finally {
    selectingChannel.value = null;
  }
}

function applyAsset(channel: CampaignChannel, asset: MarketingAsset) {
  const index = model.value.findIndex((message) => message.channel === channel);
  const current = model.value[index] ?? createChannelMessage(channel);
  const message = applyAssetToMessage(current, asset);
  if (index >= 0) model.value.splice(index, 1, message);
  else model.value.push(message);
  emit("change");
}

function openCreate(channel: CampaignChannel) {
  creatingChannel.value = channel;
  isCreateOpen.value = true;
}

async function assetCreated(asset: MarketingAsset) {
  await loadSummary();
  applyAsset(creatingChannel.value, asset);
}

function selectedAssetName(channel: CampaignChannel) {
  const message = messageFor(channel);
  return summary.value?.[channel]?.find((asset) => asset.id === message?.asset_id)?.name
    ?? message?.asset?.name
    ?? null;
}

function bodyPreview(channel: CampaignChannel) {
  return (messageFor(channel)?.body ?? "").slice(0, 3000);
}

function channelIcon(channel: CampaignChannel) {
  return icons[channel];
}

function channelLabel(channel: CampaignChannel) {
  const labels: Record<CampaignChannel, string> = {
    email: "Email",
    inbox: "Inbox",
    webpush: "Web Push",
    sms: "SMS",
    popup: "OnSite",
    callcenter: "Voz",
    whatsapp: "WhatsApp",
    rcs: MARKETING_CHANNEL_LABELS.rcs,
  };
  return labels[channel];
}
</script>
