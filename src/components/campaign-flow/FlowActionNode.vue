<template>
  <FlowNodeShell
    :icon="actionIcon"
    :title="data.label"
    :description="data.description"
    :selected="selected"
    :node-id="id"
    icon-color-class="text-rose-500 dark:text-rose-400"
    icon-background-class="bg-rose-500/15"
    width-class="w-[270px]"
  >
    <div v-if="data.nodeType === 'send_sms' || data.nodeType === 'send_email'" class="space-y-2">
      <div class="space-y-1">
        <Label class="text-[11px]">Template de {{ channelLabel }} *</Label>
        <select
          class="nodrag h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
          :disabled="isReadonly || isLoadingAsset"
          :value="selectedAssetId ?? ''"
          @change="selectAsset"
        >
          <option value="">Selecionar template</option>
          <option v-for="asset in availableAssets" :key="asset.id" :value="asset.id">
            {{ asset.name }}
          </option>
        </select>
        <p v-if="isLoadingAsset" class="text-[10px] text-muted-foreground">Carregando template...</p>
        <p v-else-if="selectedAssetId && !previewAsset" class="text-[10px] text-destructive">
          Template selecionado não foi encontrado neste projeto.
        </p>
        <p v-else-if="!selectedAssetId && legacyContent" class="text-[10px] text-amber-600 dark:text-amber-400">
          Conteúdo inline legado. Selecione um template para substituí-lo.
        </p>
        <router-link
          :to="{ name: channel === 'sms' ? 'marketing.sms' : 'marketing.emails' }"
          class="inline-block text-[10px] text-primary underline"
          @click.stop
        >Gerenciar templates</router-link>
      </div>

      <details v-if="previewAsset" class="rounded-md border bg-muted/30 p-2 text-[11px]">
        <summary class="cursor-pointer font-medium">{{ previewAsset.name }}</summary>
        <p v-if="channel === 'email'" class="mt-2 text-muted-foreground">Assunto: {{ previewAsset.subject }}</p>
        <pre class="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-muted-foreground">{{ bodyPreview }}</pre>
      </details>
      <pre v-else-if="!selectedAssetId && legacyContent" class="max-h-20 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-[11px] text-muted-foreground">{{ legacyPreview }}</pre>

      <div class="space-y-1">
        <Label class="text-[11px]">ID do link rastreado (opcional)</Label>
        <Input
          type="number"
          min="1"
          class="nodrag h-7 text-xs"
          placeholder="ID do link do projeto"
          :disabled="isReadonly"
          :model-value="(data.config.link_id as number | null) ?? ''"
          @update:model-value="updateLinkId"
        />
      </div>
    </div>

    <template #handles>
      <Handle type="target" :position="Position.Top" />
      <Handle type="source" :position="Position.Bottom" />
    </template>
  </FlowNodeShell>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, type Ref } from "vue";
import { Handle, Position, useVueFlow, type NodeProps } from "@vue-flow/core";
import { CheckCircle2, Mail, MessageSquare } from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FlowNodeShell from "@/components/campaign-flow/FlowNodeShell.vue";
import type { FlowCanvasNodeData } from "@/lib/flowDefinition";
import type { MarketingAsset, MarketingAssetSummary } from "@/contracts/marketingAssets";
import { getMarketingAsset } from "@/services/marketingAssets";

const props = defineProps<NodeProps<FlowCanvasNodeData>>();
const { updateNodeData } = useVueFlow();
const isReadonly = inject<Ref<boolean>>("flowReadonly", ref(false));
const flowAssets = inject<Ref<MarketingAssetSummary | null> | null>("flowAssets", null);
const previewAsset = ref<MarketingAsset | null>(null);
const isLoadingAsset = ref(false);

const channel = computed(() => props.data.nodeType === "send_email" ? "email" : "sms");
const channelLabel = computed(() => channel.value === "email" ? "E-mail" : "SMS");
const selectedAssetId = computed(() => {
  const value = Number(props.data.config.asset_id);
  return Number.isFinite(value) && value > 0 ? value : null;
});
const availableAssets = computed(() => flowAssets?.value?.[channel.value] ?? []);
const legacyContent = computed(() => String(props.data.config.message || ""));
const bodyPreview = computed(() => (previewAsset.value?.body || "").slice(0, 600));
const legacyPreview = computed(() => legacyContent.value.slice(0, 400));

const actionIcon = computed(() => {
  if (props.data.nodeType === "send_sms") return MessageSquare;
  if (props.data.nodeType === "send_email") return Mail;
  return CheckCircle2;
});

watch(selectedAssetId, loadPreview, { immediate: true });

async function loadPreview(assetId: number | null) {
  previewAsset.value = null;
  if (!assetId) return;
  isLoadingAsset.value = true;
  try {
    previewAsset.value = await getMarketingAsset(assetId);
  } catch {
    previewAsset.value = null;
  } finally {
    isLoadingAsset.value = false;
  }
}

function selectAsset(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value) || null;
  previewAsset.value = null;
  updateConfig({ asset_id: value });
  loadPreview(value);
}

function updateLinkId(value: unknown) {
  updateConfig({
    link_id: value === "" || value === null
      ? null
      : typeof value === "string" && !Number.isNaN(Number(value))
        ? Number(value)
        : value,
  });
}

function updateConfig(config: Record<string, unknown>) {
  updateNodeData(props.id, { config: { ...props.data.config, ...config } });
}
</script>
