import api from "./base.js";

export interface ClickMinutePoint {
  minute: string;
  clicks: number;
}

export interface RedirectLatency {
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  sample_size: number;
}

export interface RedirectErrors {
  "4xx": number;
  "5xx": number;
}

export interface UnhealthyLinkItem {
  link_id: number;
  link_destination_id: number;
  url: string;
  status: "ok" | "unreachable" | "timeout" | "error" | string;
  http_status: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string | null;
}

export interface LinkEngineMonitorResponse {
  clicks_last_5min: number;
  clicks_per_minute_24h: ClickMinutePoint[];
  queue_pending: number;
  avg_processing_delay_ms: number | null;
  redirect_latency: RedirectLatency;
  redirect_errors: RedirectErrors;
  unhealthy_links: UnhealthyLinkItem[];
}

export interface LinkEngineMonitorParams {
  filter_id?: string | number;
}

export default {
  async monitor(
    params: LinkEngineMonitorParams = {},
  ): Promise<LinkEngineMonitorResponse> {
    const { data } = await api.get("/link-engine/monitor", { params });
    return data;
  },
};
