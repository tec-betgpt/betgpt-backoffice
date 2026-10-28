<template>
  <div
    class="w-[220px] rounded-md border border-border bg-card text-card-foreground shadow-sm"
    :class="selected ? 'ring-2 ring-primary' : ''"
  >
    <div class="flex items-center gap-2 border-b border-border px-3 py-2">
      <Zap class="size-4 shrink-0 text-amber-500" />
      <div class="min-w-0">
        <div class="truncate text-xs font-semibold">{{ data.label }}</div>
        <div class="text-[10px] uppercase tracking-wide text-muted-foreground">Gatilho</div>
      </div>
    </div>

    <div v-if="data.description" class="px-3 py-2">
      <p class="text-xs text-muted-foreground">{{ data.description }}</p>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, type NodeProps } from "@vue-flow/core";
import { Zap } from "lucide-vue-next";
import type { FlowCanvasNodeData } from "@/lib/flowDefinition";

defineProps<NodeProps<FlowCanvasNodeData>>();
</script>
