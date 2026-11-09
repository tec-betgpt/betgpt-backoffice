<template>
  <FlowNodeShell
    :icon="Zap"
    :title="data.label"
    :description="data.description"
    :selected="selected"
    :node-id="id"
    icon-color-class="text-violet-500 dark:text-violet-400"
    icon-background-class="bg-violet-500/15"
    width-class="w-[220px]"
  >
    <template #handles>
      <Handle type="source" :position="Position.Bottom" />
    </template>
  </FlowNodeShell>
</template>

<script setup lang="ts">
import { Handle, Position, type NodeProps } from "@vue-flow/core";
import { Zap } from "lucide-vue-next";
import FlowNodeShell from "@/components/campaign-flow/FlowNodeShell.vue";
import type { FlowCanvasNodeData } from "@/lib/flowDefinition";

defineProps<NodeProps<FlowCanvasNodeData>>();
</script>
