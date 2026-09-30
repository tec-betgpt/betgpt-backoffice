import api from "./base.js";
import type { FinancialTransaction } from "@/contracts/financialTransaction";

interface IndexResponse {
  data: FinancialTransaction[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    global_totals: {
      total_revenue: number
      total_expense: number
      balance: number
    }
  }
}

interface IndexParams {
  filter_id?: string | null
  name?: string
  project_ids?: number[]
  search_name?: string
  start_date?: string
  end_date?: string
  sort_by?: string
  type?: string
  cost_center_id?: number
  sector_id?: number
  sort_column?: string
  sort_order?: string
  per_page: number | string
  page: number
  refresh?: number
}

interface DashboardResponse {
  period: {
    start: string
    end: string
  },
  consolidated: {
    revenue: number
    expense: number
    investment: number
    balance: number
    margin_percentage: number
    is_profitable: boolean
  },
  charts: {
    expenses_by_sector: Array<{
        label: string
        value: number
        percentage: number
      }>
    expenses_by_category: Array<{
        label: string
        value: number
        percentage: number
    }>
  }
}

interface DashboardParams {
  start_date: string
  end_date: string
  filter_id: string | null
}

interface StoreBody {
  project_id?: number
  group_id?: number
  [key: string]: unknown
}

interface UpdateBody {
  project_id?: number
  [key: string]: unknown
}

export default {
  async index(params: IndexParams): Promise<IndexResponse> {
    const { data } = await api.get("/financial-transactions", { params });
    return data;
  },

  async store(body: StoreBody) {
    const { data } = await api.post("/financial-transactions", body);
    return data;
  },

  async show(id: number) {
    const { data } = await api.get(`/financial-transactions/${id}`);
    return data;
  },

  async update(id: number, body: UpdateBody) {
    const { data } = await api.put(`/financial-transactions/${id}`, body);
    return data;
  },

  async destroy(id: number) {
    const { data } = await api.delete(`/financial-transactions/${id}`);
    return data;
  },

  async dashboard(params: DashboardParams): Promise<DashboardResponse> {
    const { data } = await api.get('/financial-transactions/dashboard', { params });
    return data;
  }
}
