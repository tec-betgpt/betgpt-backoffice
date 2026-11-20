import type { CampaignValidationItem } from "@/contracts/campaigns";

export const CAMPAIGN_VALIDATION_STEP_LABELS: Record<string, string> = {
  basic: "Dados básicos",
  audience: "Público",
  message: "Mensagem",
  links: "Links",
  schedule: "Agendamento",
  delivery_windows: "Janelas",
  recurrence_policy: "Recorrência",
  warmup_policy: "Warmup",
  campaign_type: "Tipo de campanha",
  flow_editor: "Editar fluxo",
  flow_review: "Finalizar",
  general: "Validação",
};

export type CampaignValidationGroup = {
  step: string;
  label: string;
  items: CampaignValidationItem[];
};

export function campaignValidationStepLabel(step?: string): string {
  return CAMPAIGN_VALIDATION_STEP_LABELS[step || "general"] || step || "Validação";
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
