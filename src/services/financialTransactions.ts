import api from "./base.js";

interface IndexResponse {
  data: Array<{
    id: number
    cost_center_id: number | null
    sector_id: number
    user_id: number
    type: "cost" | "revenue"
    category_type: "fixed" | "variable"
    percentage: number | null
    amount: number | string
    date: string
    description: string | null
    created_at: string
    updated_at: string
    project_id: number
    sector: {
      id: number
      name: string
    } | null
    cost_center: {
      id: number
      name: string
      sector?: {
        id: number
        name: string
      } | null
    } | null,
    user: {
      id: number
      first_name: string
      last_name: string
      initials: string
      name: string
    }
  }>
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
  filter_id?: number | null
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

export default {
  async index(params: IndexParams): Promise<IndexResponse> {
    const { data } = await api.get("/financial-transactions", { params });
    return data;
  },

  async store(body: Record<string, unknown>) {
    const { data } = await api.post("/financial-transactions", body);
    return data;
  },

  async show(id: number) {
    const { data } = await api.get(`/financial-transactions/${id}`);
    return data;
  },

  async update(id: number, body: Record<string, unknown>) {
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
