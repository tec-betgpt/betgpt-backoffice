export type GroupFinancialType = "cost" | "revenue" | "investment";

export interface GroupFinancialUser {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
}

export interface GroupFinancialTransaction {
  id: number;
  group_id: number;
  user_id: number | null;
  type: GroupFinancialType;
  category_type: string | null;
  amount: number | string;
  date: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  user?: GroupFinancialUser | null;
}

export interface GroupFinancialTransactionPayload {
  type: GroupFinancialType;
  category_type?: string | null;
  amount: number;
  date: string;
  description?: string | null;
}

export interface GroupFinancialListParams {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  type?: GroupFinancialType;
}

export interface GroupFinancialChartItem {
  label: string;
  value: number;
  percentage: number;
}

export interface GroupFinancialDashboard {
  period: { start: string; end: string };
  consolidated: {
    revenue: number;
    expense: number;
    balance: number;
    margin_percentage: number;
    is_profitable: boolean;
  };
  charts: {
    expenses_by_sector: GroupFinancialChartItem[];
    expenses_by_category: GroupFinancialChartItem[];
  };
}

/** Lista paginada (o envelope SPA envolve este objeto em `data`). */
export interface GroupFinancialListResponse {
  data: GroupFinancialTransaction[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface GroupFinancialOriginBlock {
  project?: { revenue?: number; cost?: number; investment?: number };
  group?: { revenue?: number; cost?: number; investment?: number };
}

/**
 * DRE consolidado (`GET /groups/{group}/financials`). O shape completo ainda
 * não foi capturado do backend; os campos conhecidos pela spec estão tipados e
 * o índice permite campos extras sem quebrar a UI (renderização defensiva).
 */
export interface GroupFinancialsPayload {
  period?: { start: string; end: string };
  investimentos?: number;
  origin?: GroupFinancialOriginBlock;
  [key: string]: unknown;
}
