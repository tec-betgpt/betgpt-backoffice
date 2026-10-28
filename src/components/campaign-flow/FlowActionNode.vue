<template>
  <div
    class="w-[260px] rounded-md border border-border bg-card text-card-foreground shadow-sm"
    :class="selected ? 'ring-2 ring-primary' : ''"
  >
    <div class="flex items-center gap-2 border-b border-border px-3 py-2">
      <MessageSquare v-if="data.nodeType === 'send_sms'" class="size-4 shrink-0 text-violet-500" />
      <Mail v-else-if="data.nodeType === 'send_email'" class="size-4 shrink-0 text-violet-500" />
      <CheckCircle2 v-else class="size-4 shrink-0 text-violet-500" />
      <div class="min-w-0">
        <div class="truncate text-xs font-semibold">{{ data.label }}</div>
        <div class="text-[10px] uppercase tracking-wide text-muted-foreground">Ação</div>
      </div>
    </div>

    <div class="space-y-2 px-3 py-2">
      <p v-if="data.description" class="text-xs text-muted-foreground">{{ data.description }}</p>

      <template v-if="data.nodeType === 'send_sms' || data.nodeType === 'send_email'">
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
      </template>
    </div>

    <Handle type="target" :position="Position.Top" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from "vue";
import { Handle, Position, useVueFlow, type NodeProps } from "@vue-flow/core";
import { CheckCircle2, Mail, MessageSquare } from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FlowCanvasNodeData } from "@/lib/flowDefinition";

const props = defineProps<NodeProps<FlowCanvasNodeData>>();

const { updateNodeData } = useVueFlow();
const isReadonly = inject<Ref<boolean>>("flowReadonly", { value: false } as Ref<boolean>);

function updateConfig(key: string, value: unknown) {
  const normalized = key === "link_id" && (value === "" || value === null)
    ? null
    : key === "link_id" && typeof value === "string" && !Number.isNaN(Number(value))
      ? Number(value)
      : value;
  updateNodeData(props.id, { config: { ...props.data.config, [key]: normalized } });
}
</script>
