import { describe, expect, it } from "vitest";
import type { CampaignChannelMetrics, CampaignMonitorResponse } from "@/contracts/campaignMonitor";
import type { MarketingChannel } from "@/contracts/marketingAssets";
import { channelRows, monitorLeads, monitorProgress } from "./campaignMonitorView";

function metrics(channel: MarketingChannel, sends: number, deliveries: number): CampaignChannelMetrics {
  return { channel, sends, deliveries, opens: 0, clicks: 0, conversions: 0, bounces: 0, errors: 0, opt_outs: 0 };
}

describe("campaignMonitorView", () => {
  it("calcula taxa de entrega por canal e protege divisão por zero", () => {
    const rows = channelRows({
      sms: metrics("sms", 10, 8),
      email: metrics("email", 0, 0),
    } as Record<MarketingChannel, CampaignChannelMetrics>);
    expect(rows[0].delivery_rate).toBe(80);
    expect(rows[1].delivery_rate).toBe(0);
  });

  it("limita progresso e obtém leads do run ou forecast", () => {
    const monitor = {
      forecast: { completed_percent: 120, total_recipients: 50 },
      run: { counts: { total_recipients: 80 } },
    } as CampaignMonitorResponse;
    expect(monitorProgress(monitor)).toBe(100);
    expect(monitorLeads(monitor)).toBe(80);
    expect(monitorLeads({ ...monitor, run: null })).toBe(50);
  });
});
