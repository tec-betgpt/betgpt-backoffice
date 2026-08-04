export type FinancialChannel = "sms" | "email";

export type FinancialStatus = "estimated" | "reserved" | "partially_consumed" | "consumed" | "released";

export type LedgerEntryType = "estimate" | "reservation" | "realization" | "release" | "adjustment";

export type LedgerSourceType = "campaign_cost_estimate" | "budget_reservation" | "consumption_event" | "manual";

export type LedgerAmounts = {
  customer_amount_cents: number;
  supplier_amount_cents: number;
  margin_amount_cents: number;
};

export type LedgerReservationTotals = {
  count: number;
  quantity: number;
} & LedgerAmounts;

export type CampaignCostEstimate = {
  id: number;
  configuration_hash: string;
  estimated_recipients: number;
  estimated_sms_segments: number;
  estimated_emails: number;
  customer_unit_price_cents: number;
  supplier_unit_cost_cents: number | null;
  estimated_customer_amount_cents: number;
  estimated_supplier_amount_cents: number | null;
  estimated_margin_amount_cents: number | null;
  provider_rate_card_id: number;
  supplier_rate_card_id: number;
  currency: string;
  calculated_at: string;
};

export type CampaignCostBreakdown = {
  quantity: number;
  unit: string;
} & LedgerAmounts;

export type CampaignCostsResponse = {
  campaign_id: number;
  currency: string;
  estimate: CampaignCostEstimate | null;
  reservations_by_status: Record<Exclude<FinancialStatus, "estimated">, LedgerReservationTotals>;
  realized: CampaignCostBreakdown;
  margins: {
    estimated_margin_amount_cents: number | null;
    realized_margin_amount_cents: number | null;
  };
  breakdown_by_dispatch: (CampaignCostBreakdown & { campaign_dispatch_id: number })[];
  breakdown_by_resource: (CampaignCostBreakdown & {
    billable_resource_id: number | null;
    billable_resource: string;
    channel: string;
  })[];
  timestamps: {
    calculated_at: string;
    last_consumption_at: string | null;
    updated_at: string;
  };
};

export type ResourceUsageParams = {
  filter_id?: string | null;
  project_id?: number | null;
  campaign_id?: number | null;
  channel?: FinancialChannel | null;
  provider?: string | null;
  supplier?: string | null;
  billable_resource?: string | null;
  date_from?: string | null;
  date_to?: string | null;
};

export type ResourceUsageGroup = LedgerAmounts & {
  quantity: number;
};

export type ResourceUsageResponse = {
  currency: string;
  totals: ResourceUsageGroup;
  by_resource: (ResourceUsageGroup & { billable_resource: string; channel: string })[];
  by_provider: (ResourceUsageGroup & { provider: string })[];
  timestamps: {
    last_event_at: string | null;
  };
};

export type LedgerParams = {
  filter_id?: string | null;
  project_id?: number | null;
  campaign_id?: number | null;
  campaign_dispatch_id?: number | null;
  entry_type?: LedgerEntryType | null;
  source_type?: LedgerSourceType | null;
  date_from?: string | null;
  date_to?: string | null;
  per_page?: number | null;
  page?: number | null;
};

export type LedgerEntry = {
  id: number;
  entry_type: LedgerEntryType;
  signed_amount_cents: number | null;
  supplier_amount_cents: number | null;
  quantity: number;
  unit: string;
  currency: string;
  campaign_id: number | null;
  project_id: number | null;
  billable_resource_id: number | null;
  source_type: LedgerSourceType;
  source_id: number | null;
  description: string | null;
  occurred_at: string | null;
  metadata: Record<string, unknown> | null;
  campaign: {
    id: number;
    uuid: string;
    name: string;
    project_id: number;
  } | null;
  billable_resource: {
    id: number;
    code: string;
    channel: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type LedgerListResponse = {
  current_page: number;
  data: LedgerEntry[];
  per_page: number;
  total: number;
  last_page: number;
  links: unknown[];
};

export const LEDGER_ENTRY_TYPE_LABELS: Record<LedgerEntryType, string> = {
  estimate: "Estimativa",
  reservation: "Reserva",
  realization: "Realização",
  release: "Liberação",
  adjustment: "Ajuste",
};

export const LEDGER_ENTRY_TYPE_OPTIONS = Object.entries(LEDGER_ENTRY_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as LedgerEntryType, label }),
);

export const LEDGER_SOURCE_TYPE_LABELS: Record<LedgerSourceType, string> = {
  campaign_cost_estimate: "Estimativa de custo",
  budget_reservation: "Reserva de orçamento",
  consumption_event: "Evento de consumo",
  manual: "Manual",
};

export const LEDGER_SOURCE_TYPE_OPTIONS = Object.entries(LEDGER_SOURCE_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as LedgerSourceType, label }),
);

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  estimated: "Estimado",
  reserved: "Reservado",
  partially_consumed: "Parcialmente consumido",
  consumed: "Consumido",
  released: "Liberado",
};

export const FINANCIAL_STATUS_ORDER: FinancialStatus[] = [
  "estimated",
  "reserved",
  "partially_consumed",
  "consumed",
  "released",
];

export function formatCents(value: number | null | undefined, currency = "BRL"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value / 100);
}

export function formatSignedCents(value: number | null | undefined, currency = "BRL"): string {
  if (value === null || value === undefined) return "—";
  return `${value < 0 ? "−" : ""}${new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Math.abs(value) / 100)}`;
}

export function deriveFinancialStatus(costs: CampaignCostsResponse | null): FinancialStatus | null {
  if (!costs) return null;

  const reservations = costs.reservations_by_status;
  const hasActiveReservation = reservations.reserved.count > 0 || reservations.partially_consumed.count > 0;
  const hasConsumption = reservations.consumed.count > 0 || costs.realized.quantity > 0;

  if (hasActiveReservation && hasConsumption) return "partially_consumed";
  if (hasConsumption) return "consumed";
  if (reservations.released.count > 0) return "released";
  if (hasActiveReservation) return "reserved";
  if (costs.estimate) return "estimated";
  return null;
}
