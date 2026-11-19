import type {
  CampaignChannelMetrics,
  CampaignMonitorResponse,
} from "@/contracts/campaignMonitor";
import type { MarketingChannel } from "@/contracts/marketingAssets";

export type CampaignChannelRow = CampaignChannelMetrics & { delivery_rate: number };

export function channelRows(
  channels: Record<MarketingChannel, CampaignChannelMetrics>,
): CampaignChannelRow[] {
  return Object.values(channels).map((metrics) => ({
    ...metrics,
    delivery_rate: metrics.sends > 0
      ? Math.min(Math.round(metrics.deliveries / metrics.sends * 10000) / 100, 100)
      : 0,
  }));
}

export function monitorProgress(monitor: CampaignMonitorResponse | null): number {
  return Math.max(0, Math.min(monitor?.forecast.completed_percent ?? 0, 100));
}

export function monitorLeads(monitor: CampaignMonitorResponse | null): number {
  return monitor?.run?.counts.total_recipients ?? monitor?.forecast.total_recipients ?? 0;
}
