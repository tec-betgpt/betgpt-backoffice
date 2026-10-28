import type { Edge, Node, ViewportTransform } from "@vue-flow/core";
import {
  FLOW_NODE_TYPE_LABELS,
  flowNodeCategoryFor,
  type FlowConditionHandle,
  type FlowDefinition,
  type FlowNodeCategory,
  type FlowViewport,
} from "@/contracts/campaignFlow";

/** Estrutura de `data` dos nós customizados no canvas Vue Flow. */
export type FlowCanvasNodeData = {
  nodeType: string;
  category: FlowNodeCategory;
  label: string;
  description?: string;
  config: Record<string, unknown>;
};

let flowIdCounter = 0;

export function generateFlowId(prefix: string): string {
  flowIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${flowIdCounter.toString(36)}`;
}

export function createCanvasNode(
  nodeType: string,
  category: FlowNodeCategory,
  position: { x: number; y: number },
  overrides: Partial<{ id: string; label: string; description: string; config: Record<string, unknown> }> = {},
): Node<FlowCanvasNodeData> {
  return {
    id: overrides.id || generateFlowId("node"),
    type: category,
    position,
    data: {
      nodeType,
      category,
      label: overrides.label || FLOW_NODE_TYPE_LABELS[nodeType] || nodeType,
      description: overrides.description,
      config: { ...(overrides.config || {}) },
    },
  };
}

function conditionHandleLabel(handle: string | null | undefined): string | undefined {
  if (handle === "yes") return "SIM";
  if (handle === "no") return "NÃO";
  return undefined;
}

/** Converte o estado do canvas (Vue Flow) para o contrato persistido em `flow_config`. */
export function toFlowDefinition(
  nodes: Node<FlowCanvasNodeData>[],
  edges: Edge[],
  viewport: FlowViewport | null,
): FlowDefinition {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data?.nodeType || node.type || "",
      category: node.data?.category,
      label: node.data?.label,
      position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
      config: { ...(node.data?.config || {}) },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      source_handle: edge.sourceHandle ?? null,
      target_handle: edge.targetHandle ?? null,
      label: conditionHandleLabel(edge.sourceHandle as FlowConditionHandle | undefined),
    })),
    viewport,
  };
}

/** Hidrata o canvas (Vue Flow) a partir da definição persistida. */
export function fromFlowDefinition(definition: FlowDefinition | null | undefined): {
  nodes: Node<FlowCanvasNodeData>[];
  edges: Edge[];
  viewport: FlowViewport | null;
} {
  if (!definition) {
    return { nodes: [], edges: [], viewport: null };
  }

  const nodes = (definition.nodes || []).map((node) =>
    createCanvasNode(
      String(node.type),
      node.category || flowNodeCategoryFor(String(node.type)),
      node.position || { x: 0, y: 0 },
      {
        id: node.id,
        label: node.label,
        config: node.config || {},
      },
    ),
  );

  const edges: Edge[] = (definition.edges || []).map((edge) => ({
    id: edge.id || generateFlowId("edge"),
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.source_handle ?? undefined,
    targetHandle: edge.target_handle ?? undefined,
    label: edge.label || conditionHandleLabel(edge.source_handle as FlowConditionHandle | undefined),
    animated: false,
  }));

  return { nodes, edges, viewport: definition.viewport || null };
}

export function viewportFromTransform(transform: ViewportTransform | null | undefined): FlowViewport | null {
  if (!transform) return null;
  return { x: transform.x, y: transform.y, zoom: transform.zoom };
}

/** Config inicial por tipo de nó (alinhada a config_fields/required_config de config/campaign_flow.php). */
export function createDefaultNodeConfig(nodeType: string): Record<string, unknown> {
  switch (nodeType) {
    case "wait_for_deposit":
      return { comparator: "any", amount: null, max_wait_value: 24, max_wait_unit: "hours" };
    case "delay":
      return { value: 1, unit: "hours" };
    case "send_sms":
      return { message: "", link_id: null };
    case "send_email":
      return { subject: "", message: "", link_id: null };
    default:
      return {};
  }
}
