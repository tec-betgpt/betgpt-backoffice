import type { CampaignStorePayload, CampaignUpdatePayload } from "@/contracts/campaigns";

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
