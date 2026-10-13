<template>
  <div class="flex h-[calc(100dvh-300px)] min-h-[560px] flex-col overflow-hidden rounded-md border border-border">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="readonly || catalogLoading" @click="isGalleryOpen = true">
          Templates
        </Button>
        <Badge variant="outline">{{ nodes.length }} nó(s)</Badge>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <Button size="sm" :disabled="readonly || saving" @click="emit('save')">
          {{ saving ? "Salvando..." : "Salvar & Continuar" }}
        </Button>
      </div>
    </div>

    <div class="flex min-h-0 flex-1">
      <FlowNodeCatalogPanel
        :catalog="catalog"
        :loading="catalogLoading"
        :disabled="readonly"
        :trigger-types="triggerTypes"
        @add-node="addNodeFromCatalog"
      />

      <div ref="canvasWrapper" class="relative min-w-0 flex-1">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          class="campaign-flow-canvas"
          :delete-key-code="readonly ? null : ['Delete', 'Backspace']"
          :nodes-draggable="!readonly"
          :nodes-connectable="!readonly"
          :elements-selectable="!readonly"
          :edges-focusable="!readonly"
          :min-zoom="0.2"
          :max-zoom="2"
          :fit-view-on-init="!hasSavedViewport"
          @connect="onConnect"
          @init="onInit"
          @viewport-change-end="onViewportChangeEnd"
        >
          <template #node-trigger="nodeProps">
            <FlowTriggerNode v-bind="nodeProps" />
          </template>
          <template #node-condition="nodeProps">
            <FlowConditionNode v-bind="nodeProps" />
          </template>
          <template #node-action="nodeProps">
            <FlowActionNode v-bind="nodeProps" />
          </template>

          <Background variant="dots" :gap="20" :size="1" pattern-color="hsl(var(--muted-foreground))" />
          <Controls position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            node-color="hsl(var(--muted-foreground))"
            mask-color="hsl(var(--background) / 0.75)"
          />
        </VueFlow>
      </div>
    </div>

    <FlowTemplatesGallery
      v-model:open="isGalleryOpen"
      :templates="templates"
      :loading="catalogLoading"
      @select-template="applyTemplate"
      @select-blank="applyBlank"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, toRef, watch } from "vue";
import {
  MarkerType,
  VueFlow,
  useVueFlow,
  type Connection,
  type Edge,
  type Node,
  type ViewportTransform,
} from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { toast } from "vue-sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FlowActionNode from "@/components/campaign-flow/FlowActionNode.vue";
import FlowConditionNode from "@/components/campaign-flow/FlowConditionNode.vue";
import FlowNodeCatalogPanel from "@/components/campaign-flow/FlowNodeCatalogPanel.vue";
import FlowTemplatesGallery from "@/components/campaign-flow/FlowTemplatesGallery.vue";
import FlowTriggerNode from "@/components/campaign-flow/FlowTriggerNode.vue";
import type {
  CampaignFlowConfig,
  FlowNodeTypeCatalogItem,
  FlowTemplate,
  FlowViewport,
} from "@/contracts/campaignFlow";
import {
  createCanvasNode,
  createDefaultNodeConfig,
  fromFlowDefinition,
  generateFlowId,
  toFlowDefinition,
  type FlowCanvasNodeData,
} from "@/lib/flowDefinition";

import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import "@vue-flow/minimap/dist/style.css";

const props = defineProps<{
  modelValue: CampaignFlowConfig | null;
  catalog: FlowNodeTypeCatalogItem[];
  templates: FlowTemplate[];
  catalogLoading?: boolean;
  readonly?: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: CampaignFlowConfig): void;
  (e: "save"): void;
}>();

const nodes = ref<Node<FlowCanvasNodeData>[]>([]);
const edges = ref<Edge[]>([]);
const currentViewport = ref<FlowViewport | null>(null);
const isGalleryOpen = ref(false);
const canvasWrapper = ref<HTMLElement | null>(null);

const { addEdges, addNodes, screenToFlowCoordinate, setViewport } = useVueFlow();

provide("flowReadonly", toRef(props, "readonly"));

const triggerTypes = computed(() =>
  nodes.value.filter((node) => node.data?.category === "trigger").map((node) => String(node.data?.nodeType)),
);

const hasSavedViewport = computed(() => Boolean(props.modelValue?.definition?.viewport));

let suppressSync = false;
let addOffset = 0;

onMounted(() => {
  hydrate(props.modelValue);
  if (!props.modelValue?.definition?.nodes?.length && !props.readonly) {
    isGalleryOpen.value = true;
  }
});

watch(
  [nodes, edges, currentViewport],
  () => {
    if (suppressSync) {
      suppressSync = false;
      return;
    }
    const next: CampaignFlowConfig = {
      version: props.modelValue?.version ?? 1,
      definition: toFlowDefinition(nodes.value, edges.value, currentViewport.value),
      entry_audience: props.modelValue?.entry_audience ?? null,
    };
    const currentSerialized = JSON.stringify(props.modelValue?.definition ?? null);
    if (JSON.stringify(next.definition) === currentSerialized) return;
    emit("update:modelValue", next);
  },
  { deep: true },
);

function hydrate(config: CampaignFlowConfig | null) {
  suppressSync = true;
  const hydrated = fromFlowDefinition(config?.definition || null);
  nodes.value = hydrated.nodes;
  edges.value = hydrated.edges.map((edge) => ({ ...edge, markerEnd: MarkerType.ArrowClosed }));
  currentViewport.value = hydrated.viewport;
  nextTick(() => {
    suppressSync = false;
  });
}

function onInit() {
  if (hasSavedViewport.value && props.modelValue?.definition?.viewport) {
    setViewport(props.modelValue.definition.viewport);
  }
}

function onConnect(connection: Connection) {
  if (props.readonly) return;

  addEdges({
    id: generateFlowId("edge"),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle ?? undefined,
    targetHandle: connection.targetHandle ?? undefined,
    label: connection.sourceHandle === "yes" ? "SIM" : connection.sourceHandle === "no" ? "NÃO" : undefined,
    markerEnd: MarkerType.ArrowClosed,
  });
}

function onViewportChangeEnd(viewport: ViewportTransform) {
  currentViewport.value = { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
}

function nextNodePosition() {
  addOffset += 1;
  const fallback = { x: 120 + addOffset * 36, y: 120 + addOffset * 24 };

  if (!canvasWrapper.value) return fallback;

  const bounds = canvasWrapper.value.getBoundingClientRect();
  try {
    const point = screenToFlowCoordinate({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
    return { x: point.x + addOffset * 12, y: point.y + addOffset * 12 };
  } catch {
    return fallback;
  }
}

function addNodeFromCatalog(item: FlowNodeTypeCatalogItem) {
  if (props.readonly) return;

  if (item.category === "trigger" && triggerTypes.value.length > 0) {
    toast("Já existe um gatilho de entrada no fluxo. Remova o atual para trocar.");
    return;
  }

  addNodes(
    createCanvasNode(String(item.key), item.category, nextNodePosition(), {
      label: item.label,
      description: item.description,
      config: createDefaultNodeConfig(String(item.key)),
    }),
  );
}

function applyTemplate(template: FlowTemplate) {
  if (props.readonly) return;

  const hydrated = fromFlowDefinition(template.definition);
  suppressSync = true;
  nodes.value = hydrated.nodes.map((node) => ({ ...node, id: generateFlowId("node") }));
  const idMap = new Map(hydrated.nodes.map((node, index) => [node.id, nodes.value[index].id]));
  edges.value = hydrated.edges.map((edge) => ({
    ...edge,
    id: generateFlowId("edge"),
    source: idMap.get(edge.source) || edge.source,
    target: idMap.get(edge.target) || edge.target,
    markerEnd: MarkerType.ArrowClosed,
  }));
  currentViewport.value = hydrated.viewport;
  suppressSync = false;
  toast(`Template "${template.name}" aplicado.`);
}

function applyBlank() {
  if (props.readonly) return;

  suppressSync = true;
  nodes.value = [];
  edges.value = [];
  currentViewport.value = null;
  suppressSync = false;
}
</script>
