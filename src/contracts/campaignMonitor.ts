import type { MarketingChannel } from "@/contracts/marketingAssets";
import type { CampaignStatus } from "@/contracts/campaigns";

export type CampaignChannelMetrics = {
  channel: MarketingChannel;
  sends: number;
  deliveries: number;
  opens: number;
  clicks: number;
  conversions: number;
  bounces: number;
  errors: number;
  opt_outs: number;
};

export type CampaignMonitorTotals = Omit<CampaignChannelMetrics, "channel">;

export type CampaignMonitorHistoryItem = {
  id: string;
  type: "batch" | string;
  source: string;
  label: string;
  channel: MarketingChannel;
  status: string;
  messages_count: number;
  sent_count: number;
  failed_count: number;
  message: string;
  occurred_at: string | null;
};

export type CampaignMonitorErrorItem = {
  id: string;
  source: string;
  channel: MarketingChannel;
  message: string;
  occurred_at: string | null;
  event_type?: string;
  recipient_id?: number | null;
  player_id?: number | null;
  contact?: string | null;
  node_id?: string;
  node_type?: string;
  type?: string;
  [key: string]: unknown;
};

export type CampaignMonitorForecast = {
  total_recipients: number;
  sent: number;
  failed: number;
  pending: number;
  completed_percent: number;
  rate_per_minute: number;
  eta_seconds: number | null;
  estimate_complete_at: string | null;
};

export type CampaignMonitorRun = {
  id: number;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  counts: {
    total_recipients: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    canceled: number;
  };
  metadata?: Record<string, unknown>;
};

export type CampaignMonitorEventType = "opens" | "clicks" | "conversions" | "bounces";

export type CampaignMonitorEventItem = {
  id: string;
  source: string;
  event_type: string;
  channel: MarketingChannel;
  contact: string | null;
  player_id: number | null;
  occurred_at: string | null;
};

export type CampaignMonitorEventsResponse = {
  campaign_id: number;
  type: CampaignMonitorEventType;
  events: CampaignMonitorEventItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type CampaignMonitorResponse = {
  campaign_id: number;
  campaign_status: CampaignStatus;
  run: CampaignMonitorRun | null;
  waves: unknown[];
  events: Record<string, unknown>;
  forecast: CampaignMonitorForecast;
  channels: Record<MarketingChannel, CampaignChannelMetrics>;
  channel_totals: CampaignMonitorTotals;
  history: CampaignMonitorHistoryItem[];
  errors: CampaignMonitorErrorItem[];
};
