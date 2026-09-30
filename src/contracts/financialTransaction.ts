export interface FinancialTransactionSector {
  id: number
  name: string
}

/**
 * Item do index de GET /v1/financial-transactions.
 * O backend carrega as relações `sector`, `costCenter.sector` (serializada
 * como `cost_center`), `user` e `project` (com `logo_url`).
 */
export interface FinancialTransaction {
  id: number
  cost_center_id: number | null
  sector_id: number | null
  user_id: number
  type: "cost" | "revenue"
  category_type: "fixed" | "variable"
  percentage: number | null
  amount: number | string
  date: string
  description: string | null
  project_id: number | null
  group_id: number | null
  created_at: string
  updated_at: string
  project?: {
    id: number
    name: string
    logo_url: string | null
  } | null
  sector: FinancialTransactionSector | null
  cost_center: {
    id: number
    name: string
    sector?: FinancialTransactionSector | null
  } | null
  user: {
    id: number
    first_name: string
    last_name: string
    initials: string
    name: string
  } | null
}
