import type { LinkListItem } from "@/contracts/link";

export interface LinkClickMetrics {
  total: number | null;
  last24h: number | null;
}

const integerFormatter = new Intl.NumberFormat("pt-BR");

function toCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getLinkClickMetrics(link: LinkListItem): LinkClickMetrics {
  return {
    total: toCount(link.clicks?.total ?? link.total_clicks),
    last24h: toCount(link.clicks?.last_24h ?? link.clicks_24h),
  };
}

export function formatClickCount(value: number | null): string {
  return value === null ? "—" : integerFormatter.format(value);
}
