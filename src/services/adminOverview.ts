import api from "./base";

export type PostbackState = "ok" | "attention" | "stopped" | "never";
export type BillingState = "ok" | "pending" | "overdue" | "none";

export interface AdminOverviewProject {
  id: number;
  name: string;
  logo: string | null;
  active: boolean;
  workspace_id: string;
  postback: {
    last_at: string | null;
    minutes_since: number | null;
    count_24h: number;
    hourly_24h: number[];
    state: PostbackState;
  };
  billing: {
    state: BillingState;
    overdue_amount: number;
    pending_amount: number;
    next_due_at: string | null;
  };
}

export interface AdminOverview {
  generated_at: string;
  totals: {
    projects_active: number;
    projects_ok: number;
    projects_attention: number;
    projects_stopped: number;
    projects_never: number;
    postbacks_24h: number;
    invoices_overdue_count: number;
    invoices_overdue_amount: number;
    invoices_pending_count: number;
    invoices_pending_amount: number;
    invoices_paid_30d_amount: number;
  };
  projects: AdminOverviewProject[];
  invoices_upcoming: Array<{
    id: number;
    name: string;
    account_name: string | null;
    amount: number;
    status: string;
    due_at: string | null;
  }>;
  platform: {
    failed_jobs_24h: number | null;
    queue_pending: number | null;
    last_postback_at: string | null;
  };
}

export default {
  /** GET /v1/admin/overview (só membros da Elevate) */
  async show(): Promise<AdminOverview> {
    const { data } = await api.get("/admin/overview");
    return data?.data ?? data;
  },
};
