export interface ActiveCampaignMetricRow {
  project_id: number;
  id: string;
  name: string;
  ldate: string;
  send_amt: number;
  subscriberclicks: number;
  softbounces: number;
  uniqueopens: number;
  unsubscribes: number;
  rate_opens: number;
  rate_opens_click: number;
  rate_clicks: number;
  rate_unsubscriptions: number;
  rate_rejections: number;
}

export interface ActiveCampaignStatusRow {
  project_id: number;
  qt_contact: number;
  limit_contact: number;
  qt_limit_exceeded: number;
  qt_mail_limits: number;
  qt_mail_sent: number;
  qt_mail_exceeded: number;
}

/**
 * Resposta de GET /v1/active-campaign (e /legacy).
 */
export interface ActiveCampaignIndexResponse {
  campaigns: {
    data: ActiveCampaignMetricRow[];
    total: Record<string, number> | null;
    pagination: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
  status: ActiveCampaignStatusRow[];
  integrations: Record<number, any>;
  permissions: {
    view_status: boolean;
  };
  meta: Record<string, any>;
}
