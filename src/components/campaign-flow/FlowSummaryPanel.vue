<template>
  <Card>
    <CardHeader>
      <CardTitle>Resumo do fluxo</CardTitle>
      <CardDescription>Visão geral da jornada configurada (somente leitura).</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <p v-if="!definition || definition.nodes.length === 0" class="text-sm text-muted-foreground">
        Nenhum fluxo definido ainda. Volte para a etapa de edição e monte a jornada.
      </p>

      <template v-else>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Nós no fluxo</div>
            <div class="mt-1 text-sm font-medium">{{ definition.nodes.length }}</div>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Conexões</div>
            <div class="mt-1 text-sm font-medium">{{ definition.edges.length }}</div>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Gatilho de entrada</div>
            <div class="mt-1 text-sm font-medium">{{ entryTriggerLabel }}</div>
          </div>
          <div class="rounded-md border p-3">
            <div class="text-xs uppercase text-muted-foreground">Condições</div>
            <div class="mt-1 text-sm font-medium">{{ conditionCount }}</div>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="text-sm font-medium">Ações por canal</h4>
          <div class="flex flex-wrap gap-2">
            <Badge variant="outline">SMS: {{ actionCounts.send_sms }}</Badge>
            <Badge variant="outline">E-mail: {{ actionCounts.send_email }}</Badge>
            <Badge variant="outline">Conversão: {{ actionCounts.mark_converted }}</Badge>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="text-sm font-medium">Sequência de nós</h4>
          <ul class="space-y-1 text-sm text-muted-foreground">
            <li v-for="node in orderedNodes" :key="node.id" class="flex items-center gap-2">
              <Badge variant="secondary" class="text-[10px] uppercase">{{ categoryLabel(node) }}</Badge>
              <span>{{ node.label || flowNodeTypeLabel(String(node.type)) }}</span>
            </li>
          </ul>
        </div>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FLOW_NODE_CATEGORY_LABELS,
  flowNodeTypeLabel,
  type FlowDefinition,
  type FlowNode,
} from "@/contracts/campaignFlow";

const props = defineProps<{
  definition: FlowDefinition | null;
}>();

const entryTriggerLabel = computed(() => {
  const trigger = (props.definition?.nodes || []).find((node) => node.category === "trigger");
  if (!trigger) return "Nenhum gatilho definido";
  return trigger.label || flowNodeTypeLabel(String(trigger.type));
});

const conditionCount = computed(
  () => (props.definition?.nodes || []).filter((node) => node.category === "condition").length,
);

const actionCounts = computed(() => {
  const counts = { send_sms: 0, send_email: 0, mark_converted: 0 };
  for (const node of props.definition?.nodes || []) {
    if (node.type === "send_sms") counts.send_sms += 1;
    if (node.type === "send_email") counts.send_email += 1;
    if (node.type === "mark_converted") counts.mark_converted += 1;
  }
  return counts;
});

const CATEGORY_ORDER = { trigger: 0, condition: 1, action: 2 } as const;

const orderedNodes = computed(() =>
  [...(props.definition?.nodes || [])].sort(
    (a, b) => CATEGORY_ORDER[a.category || "action"] - CATEGORY_ORDER[b.category || "action"],
  ),
);

function categoryLabel(node: FlowNode) {
  return FLOW_NODE_CATEGORY_LABELS[node.category || "action"];
}
</script>
