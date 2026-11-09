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
      <div v-if="data.nodeType === 'send_email'" class="space-y-1">
        <Label class="text-[11px]">Assunto *</Label>
        <Input
          class="nodrag h-7 text-xs"
          placeholder="Assunto do e-mail"
          :disabled="isReadonly"
          :model-value="(data.config.subject as string) || ''"
          @update:model-value="updateConfig('subject', $event)"
        />
      </div>
      <div class="space-y-1">
        <Label class="text-[11px]">Mensagem *</Label>
        <Textarea
          class="nodrag nowheel min-h-[60px] text-xs"
          :placeholder="data.nodeType === 'send_sms' ? 'Texto do SMS' : 'Corpo do e-mail'"
          :disabled="isReadonly"
          :model-value="(data.config.message as string) || ''"
          @update:model-value="updateConfig('message', $event)"
        />
        <p class="text-[10px] leading-snug text-muted-foreground">
          Variáveis: <code v-pre>{{first_name}}</code>, <code v-pre>{{name}}</code>, <code v-pre>{{valor}}</code>,
          <code v-pre>{{link_pagamento}}</code> (Pix gerado)
        </p>
      </div>
      <div class="space-y-1">
        <Label class="text-[11px]">ID do link rastreado (opcional)</Label>
        <Input
          type="number"
          min="1"
          class="nodrag h-7 text-xs"
          placeholder="ID do link do projeto"
          :disabled="isReadonly"
          :model-value="(data.config.link_id as number | null) ?? ''"
          @update:model-value="updateConfig('link_id', $event)"
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
import { computed, inject, type Ref } from "vue";
import { Handle, Position, useVueFlow, type NodeProps } from "@vue-flow/core";
import { CheckCircle2, Mail, MessageSquare } from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FlowNodeShell from "@/components/campaign-flow/FlowNodeShell.vue";
import type { FlowCanvasNodeData } from "@/lib/flowDefinition";

const props = defineProps<NodeProps<FlowCanvasNodeData>>();

const { updateNodeData } = useVueFlow();
const isReadonly = inject<Ref<boolean>>("flowReadonly", { value: false } as Ref<boolean>);

const actionIcon = computed(() => {
  if (props.data.nodeType === "send_sms") return MessageSquare;
  if (props.data.nodeType === "send_email") return Mail;
  return CheckCircle2;
});

function updateConfig(key: string, value: unknown) {
  const normalized = key === "link_id" && (value === "" || value === null)
    ? null
    : key === "link_id" && typeof value === "string" && !Number.isNaN(Number(value))
      ? Number(value)
      : value;
  updateNodeData(props.id, { config: { ...props.data.config, [key]: normalized } });
}
</script>
