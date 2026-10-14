<template>
  <div
    class="w-[240px] rounded-md border border-border bg-card text-card-foreground shadow-sm"
    :class="selected ? 'ring-2 ring-primary' : ''"
  >
    <div class="flex items-center gap-2 border-b border-border px-3 py-2">
      <GitBranch v-if="data.nodeType === 'wait_for_deposit'" class="size-4 shrink-0 text-sky-500" />
      <Clock v-else class="size-4 shrink-0 text-sky-500" />
      <div class="min-w-0">
        <div class="truncate text-xs font-semibold">{{ data.label }}</div>
        <div class="text-[10px] uppercase tracking-wide text-muted-foreground">Condição</div>
      </div>
    </div>

    <div class="space-y-2 px-3 py-2">
      <p v-if="data.description" class="text-xs text-muted-foreground">{{ data.description }}</p>

      <template v-if="data.nodeType === 'wait_for_deposit'">
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[11px]">Comparador</Label>
            <select
              class="nodrag h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
              :disabled="isReadonly"
              :value="(data.config.comparator as string) || 'any'"
              @change="updateConfig('comparator', ($event.target as HTMLSelectElement).value)"
            >
              <option value="any">Qualquer valor</option>
              <option value="gte">Maior ou igual</option>
              <option value="lte">Menor ou igual</option>
            </select>
          </div>
          <div class="space-y-1">
            <Label class="text-[11px]">Valor</Label>
            <Input
              type="number"
              min="0"
              class="nodrag h-7 text-xs"
              placeholder="—"
              :disabled="isReadonly || (data.config.comparator || 'any') === 'any'"
              :model-value="(data.config.amount as number | null) ?? ''"
              @update:model-value="updateConfig('amount', $event)"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[11px]">Espera máxima *</Label>
            <Input
              type="number"
              min="1"
              class="nodrag h-7 text-xs"
              placeholder="Ex.: 24"
              :disabled="isReadonly"
              :model-value="(data.config.max_wait_value as number | null) ?? ''"
              @update:model-value="updateConfig('max_wait_value', $event)"
            />
          </div>
          <div class="space-y-1">
            <Label class="text-[11px]">Unidade *</Label>
            <select
              class="nodrag h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
              :disabled="isReadonly"
              :value="(data.config.max_wait_unit as string) || 'hours'"
              @change="updateConfig('max_wait_unit', ($event.target as HTMLSelectElement).value)"
            >
              <option value="minutes">Minutos</option>
              <option value="hours">Horas</option>
              <option value="days">Dias</option>
            </select>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[11px]">Aguardar *</Label>
            <Input
              type="number"
              min="1"
              class="nodrag h-7 text-xs"
              placeholder="Ex.: 2"
              :disabled="isReadonly"
              :model-value="(data.config.value as number | null) ?? ''"
              @update:model-value="updateConfig('value', $event)"
            />
          </div>
          <div class="space-y-1">
            <Label class="text-[11px]">Unidade *</Label>
            <select
              class="nodrag h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
              :disabled="isReadonly"
              :value="(data.config.unit as string) || 'hours'"
              @change="updateConfig('unit', ($event.target as HTMLSelectElement).value)"
            >
              <option value="minutes">Minutos</option>
              <option value="hours">Horas</option>
              <option value="days">Dias</option>
            </select>
          </div>
        </div>
      </template>
    </div>

    <Handle type="target" :position="Position.Top" />

    <template v-if="data.nodeType === 'wait_for_deposit'">
      <div class="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide">
        <span class="text-emerald-600 dark:text-emerald-400">SIM</span>
        <span class="text-red-600 dark:text-red-400">NÃO</span>
      </div>
      <Handle id="yes" type="source" :position="Position.Bottom" class="flow-handle-yes" />
      <Handle id="no" type="source" :position="Position.Bottom" class="flow-handle-no" />
    </template>
    <Handle v-else type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from "vue";
import { Handle, Position, useVueFlow, type NodeProps } from "@vue-flow/core";
import { Clock, GitBranch } from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FlowCanvasNodeData } from "@/lib/flowDefinition";

const props = defineProps<NodeProps<FlowCanvasNodeData>>();

const { updateNodeData } = useVueFlow();
const isReadonly = inject<Ref<boolean>>("flowReadonly", { value: false } as Ref<boolean>);

function updateConfig(key: string, value: unknown) {
  const normalized = typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))
    ? Number(value)
    : value === "" || value === null
      ? null
      : value;
  updateNodeData(props.id, { config: { ...props.data.config, [key]: normalized } });
}
</script>

<style scoped>
.flow-handle-yes {
  left: 20%;
}

.flow-handle-no {
  left: 80%;
}
</style>
