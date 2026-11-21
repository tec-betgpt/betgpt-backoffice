import type {
  CampaignRecurrencePolicyPayload,
  CampaignSchedulePayload,
  CampaignScheduleType,
  CampaignStorePayload,
  CampaignUpdatePayload,
} from "@/contracts/campaigns";

export function deriveCampaignScheduleType(
  schedule: CampaignSchedulePayload,
  recurrence?: CampaignRecurrencePolicyPayload | null,
): CampaignScheduleType {
  if (recurrence?.is_enabled) return "recurring";
  return typeof schedule.starts_at === "string" && schedule.starts_at.trim() ? "scheduled" : "immediate";
}

export function normalizeCampaignPayload<T extends CampaignStorePayload | CampaignUpdatePayload>(payload: T): T {
  const normalized = normalizeCampaignDeliveryWindows(payload);
  if (!normalized.schedule) return normalized;

  return {
    ...normalized,
    schedule: {
      ...normalized.schedule,
      schedule_type: deriveCampaignScheduleType(normalized.schedule, normalized.recurrence_policy),
    },
  };
}

export function normalizeCampaignDeliveryWindows<T extends CampaignStorePayload | CampaignUpdatePayload>(payload: T): T {
  if (!Array.isArray(payload.delivery_windows)) return payload;

  return {
    ...payload,
    delivery_windows: payload.delivery_windows.map((window) => ({
      ...window,
      starts_at: normalizeTime(window.starts_at),
      ends_at: normalizeTime(window.ends_at),
    })),
  };
}

function normalizeTime(value: string | null | undefined): string | null | undefined {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
}
