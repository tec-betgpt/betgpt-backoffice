/**
 * Contratos da feature de campanha multi-estágio (flow builder).
 *
 * Fonte de verdade: backend (Fase 1) — `config/campaign_flow.php`,
 * `GET /v1/campaign-flow/catalog` (CampaignFlowController) e
 * `flow_config` no detalhe/payload da campanha. Ajustes de contrato
 * devem ser feitos neste arquivo.
 */

export type FlowNodeCategory = "trigger" | "condition" | "action";

/** Tipos de nó do catálogo do backend (App\Enums\CampaignFlowNodeType). */
export type FlowNodeType =
  | "campaign_started"
  | "user_registered"
  | "first_deposit"
  | "deposit_made"
  | "pix_generated"
  | "wait_for_deposit"
  | "delay"
  | "send_sms"
  | "send_email"
  | "mark_converted";

export type FlowNodePosition = {
  x: number;
  y: number;
};

export type FlowNodeConfig = Record<string, unknown>;

export type FlowNode = {
  id: string;
  type: FlowNodeType | string;
  category?: FlowNodeCategory;
  label?: string;
  position: FlowNodePosition;
  config?: FlowNodeConfig;
};

/** Handles de saída de nós de condição (`wait_for_deposit`): SIM/NÃO. */
export type FlowConditionHandle = "yes" | "no";

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  source_handle?: FlowConditionHandle | string | null;
  target_handle?: string | null;
  label?: string;
};

export type FlowViewport = {
  x: number;
  y: number;
  zoom: number;
};

/**
 * Config persistida na campanha (`campaign.flow_config`, tabela campaign_flow_configs).
 * O backend persiste apenas `version`, `definition` e `entry_audience`
 * (whitelist em CampaignsRepository::persistConfiguration).
 */
export type CampaignFlowConfig = {
  version: number;
  definition: FlowDefinition;
  entry_audience?: Record<string, unknown> | null;
};

export type FlowDefinition = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport?: FlowViewport | null;
};

export type FlowConfigField = {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  default?: unknown;
  min?: number;
};

/**
 * Item de tipo de nó do catálogo. O backend identifica pelo campo `key`
 * (ex.: "send_sms"); `type` no nó persistido referencia essa mesma key.
 */
export type FlowNodeTypeCatalogItem = {
  key: FlowNodeType | string;
  category: FlowNodeCategory;
  label: string;
  description: string;
  event?: string | null;
  channel?: "sms" | "email" | string;
  outputs?: string[];
  required_config?: string[];
  config_fields?: FlowConfigField[];
};

export type FlowTemplate = {
  key: string;
  name: string;
  description: string;
  category: string;
  node_count: number;
  definition: FlowDefinition;
};

/**
 * Resposta de GET /v1/campaign-flow/catalog (após unwrap do envelope
 * { success, data }): node_types vem AGRUPADO por categoria.
 */
export type FlowCatalogResponse = {
  version: number;
  node_types: {
    triggers: FlowNodeTypeCatalogItem[];
    conditions: FlowNodeTypeCatalogItem[];
    actions: FlowNodeTypeCatalogItem[];
  };
  templates: FlowTemplate[];
};

/** Achata o node_types agrupado do catálogo em uma lista única. */
export function flattenCatalogNodeTypes(
  nodeTypes: FlowCatalogResponse["node_types"] | null | undefined,
): FlowNodeTypeCatalogItem[] {
  if (!nodeTypes) return [];
  return [
    ...(nodeTypes.triggers || []),
    ...(nodeTypes.conditions || []),
    ...(nodeTypes.actions || []),
  ];
}

/** Fallbacks locais (o catálogo do backend é a fonte de verdade para labels). */
export const FLOW_NODE_TYPE_LABELS: Record<string, string> = {
  campaign_started: "Início da campanha",
  user_registered: "Jogador cadastrado",
  first_deposit: "Primeiro depósito",
  deposit_made: "Depósito realizado",
  pix_generated: "Pix gerado",
  wait_for_deposit: "Aguardar depósito",
  delay: "Aguardar",
  send_sms: "Enviar SMS",
  send_email: "Enviar e-mail",
  mark_converted: "Marcar como convertido",
};

export const FLOW_NODE_TYPE_CATEGORY: Record<string, FlowNodeCategory> = {
  campaign_started: "trigger",
  user_registered: "trigger",
  first_deposit: "trigger",
  deposit_made: "trigger",
  pix_generated: "trigger",
  wait_for_deposit: "condition",
  delay: "condition",
  send_sms: "action",
  send_email: "action",
  mark_converted: "action",
};

/** Contagens de um nó na execução (GET /v1/campaigns/{id}/flow/stats). */
export type FlowNodeStats = {
  reached: number;
  waiting: number;
  completed: number;
  skipped: number;
  failed: number;
  yes: number;
  no: number;
};

export type FlowEnrollmentSummary = {
  total: number;
  open: number;
  completed: number;
  exited: number;
  failed: number;
  converted: number;
  /** Centavos. */
  conversion_value: number;
};

export type FlowStatsResponse = {
  nodes: Record<string, FlowNodeStats>;
  enrollments: FlowEnrollmentSummary;
};

/** Relatório de recuperação (GET /v1/campaigns/{id}/flow/report). Valores em centavos. */
export type FlowRecoveryReportTotals = {
  pix_generated: number;
  pix_generated_value: number;
  entered: number;
  paid_before_message: number;
  messaged: number;
  sms_sent: number;
  emails_sent: number;
  links_created: number;
  links_opened: number;
  link_opens: number;
  recovered: number;
  recovered_value: number;
  /** Percentual (0–100) de recuperados sobre quem recebeu mensagem. */
  recovery_rate: number;
  fee_value: number;
};

export type FlowRecoveryReportDay = {
  date: string;
  entered: number;
  paid_before_message: number;
  messaged: number;
  links_opened: number;
  recovered: number;
  recovered_value: number;
};

export type FlowRecoveryReport = {
  period: { start: string; end: string };
  attribution_hours: number;
  fee_percent: number;
  totals: FlowRecoveryReportTotals;
  daily: FlowRecoveryReportDay[];
};

export type FlowRecoveryReportParams = {
  start_date?: string;
  end_date?: string;
  fee_percent?: number;
};

export const FLOW_NODE_CATEGORY_LABELS: Record<FlowNodeCategory, string> = {
  trigger: "Gatilhos",
  condition: "Condições",
  action: "Ações",
};

export const FLOW_CONDITION_HANDLE_LABELS: Record<FlowConditionHandle, string> = {
  yes: "SIM",
  no: "NÃO",
};

export const FLOW_TIME_UNIT_LABELS: Record<string, string> = {
  minutes: "Minutos",
  hours: "Horas",
  days: "Dias",
};

export function flowNodeTypeLabel(type: string | undefined | null): string {
  if (!type) return "—";
  return FLOW_NODE_TYPE_LABELS[type] || type;
}

export function flowNodeCategoryFor(type: string | undefined | null): FlowNodeCategory {
  return (type && FLOW_NODE_TYPE_CATEGORY[type]) || "action";
}

export function createEmptyFlowDefinition(): FlowDefinition {
  return { nodes: [], edges: [], viewport: null };
}

export function createEmptyFlowConfig(): CampaignFlowConfig {
  return { version: 1, definition: createEmptyFlowDefinition(), entry_audience: null };
}
