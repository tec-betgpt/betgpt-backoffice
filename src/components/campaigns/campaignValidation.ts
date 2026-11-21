import type { CampaignValidationItem } from "@/contracts/campaigns";

export const CAMPAIGN_VALIDATION_STEP_LABELS: Record<string, string> = {
  basic: "Dados básicos",
  audience: "Segmento",
  message: "Canais",
  links: "Links",
  schedule: "Agendamento",
  delivery_windows: "Dias",
  recurrence_policy: "Repetição",
  warmup_policy: "Warmup",
  campaign_type: "Tipo de campanha",
  flow_editor: "Editar fluxo",
  flow_review: "Finalizar",
  review: "Finalizar",
  general: "Validação",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nome da campanha",
  "campaign.name": "Nome da campanha",
  description: "Descrição",
  type: "Tipo da campanha",
  "campaign.type": "Tipo da campanha",
  project_id: "Projeto",
  "campaign.project_id": "Projeto",
  channel: "Canal principal",
  "campaign.channel": "Canal principal",
  messages: "Canais e mensagens",
  "messages.present": "Canais e mensagens",
  "messages.channels": "Canais selecionados",
  "message.body": "Conteúdo da mensagem",
  "message.subject": "Assunto",
  "message.asset_id": "Asset/template",
  single_stage_config: "Configuração do segmento",
  "single_stage_config.audience_mode": "Modo de segmentação",
  "single_stage_config.target_audience_id": "Segmento",
  "single_stage_config.target_audience_ids": "Segmentos",
  "single_stage_config.daily_recipient_cap": "Limite diário de destinatários",
  "single_stage_config.total_recipient_cap": "Limite total de destinatários",
  "single_stage_config.apply_protection_list": "Lista de proteção",
  "single_stage_config.apply_opt_out": "Filtro de opt-out",
  "single_stage_config.apply_suppression": "Lista de supressão",
  schedule: "Agendamento",
  "schedule.schedule_type": "Tipo de agendamento",
  "schedule.timezone": "Fuso horário",
  "schedule.starts_at": "Data e hora de início",
  "schedule.ends_at": "Data e hora de término",
  "schedule.respect_delivery_windows": "Respeito às janelas de envio",
  delivery_windows: "Janelas de envio",
  "delivery_windows.active": "Janelas de envio ativas",
  "recurrence_policy.is_enabled": "Ativação da recorrência",
  "recurrence_policy.frequency": "Frequência da repetição",
  "recurrence_policy.interval": "Intervalo da repetição",
  "recurrence_policy.days_of_week": "Dias da semana",
  "recurrence_policy.days_of_month": "Dias do mês",
  "recurrence_policy.repeat_until": "Data final da repetição",
  "recurrence_policy.max_occurrences": "Máximo de ocorrências",
  "warmup_policy.is_enabled": "Ativação do warmup",
  "warmup_policy.initial_limit": "Limite inicial do warmup",
  "warmup_policy.increment_amount": "Incremento do warmup",
  "warmup_policy.increment_type": "Tipo de incremento",
  "warmup_policy.interval": "Intervalo do warmup",
  "warmup_policy.interval_unit": "Unidade do intervalo",
  "warmup_policy.interval_value": "Valor do intervalo",
  "warmup_policy.max_limit": "Limite máximo do warmup",
  "financial.estimated_cost": "Estimativa de custo",
  links: "Links",
  status: "Status",
};

export type CampaignValidationGroup = {
  step: string;
  label: string;
  items: CampaignValidationItem[];
};

export function campaignValidationStepLabel(step?: string): string {
  return CAMPAIGN_VALIDATION_STEP_LABELS[step || "general"] || step || "Validação";
}

export function campaignValidationFieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  if (/^(?:message|messages)(?:\.\d+)?\.body$/.test(field)) return "Conteúdo da mensagem";
  if (/^(?:message|messages)(?:\.\d+)?\.subject$/.test(field)) return "Assunto";
  if (/^(?:message|messages)(?:\.\d+)?\.channel$/.test(field)) return "Canal";
  if (/^(?:message|messages)(?:\.\d+)?\.asset_id$/.test(field)) return "Asset/template";
  if (/^(?:message|messages)(?:\.\d+)?\.sms_segments_count$/.test(field)) return "Segmentos de SMS";
  if (/^delivery_windows\.\d+\.starts_at$/.test(field)) return "Horário inicial da janela";
  if (/^delivery_windows\.\d+\.ends_at$/.test(field)) return "Horário final da janela";
  if (/^delivery_windows\.\d+\.day_of_week$/.test(field)) return "Dia da semana";
  if (/^delivery_windows\.\d+$/.test(field)) return "Janela de envio";
  if (/^links\.\d+\.original_url$/.test(field)) return "URL original";
  if (/^links\.\d+\.link_id$/.test(field)) return "Link rastreável";
  if (/^links\.\d+\.status$/.test(field)) return "Status do link";
  if (field.startsWith("flow_config.") || field.startsWith("nodes.")) return "Configuração do fluxo";
  return "Configuração";
}

export function groupCampaignValidationItems(items: CampaignValidationItem[]): CampaignValidationGroup[] {
  const groups = new Map<string, CampaignValidationItem[]>();
  for (const item of items) {
    const step = item.step || "general";
    groups.set(step, [...(groups.get(step) || []), item]);
  }
  return Array.from(groups.entries()).map(([step, groupedItems]) => ({
    step,
    label: campaignValidationStepLabel(step),
    items: groupedItems,
  }));
}
