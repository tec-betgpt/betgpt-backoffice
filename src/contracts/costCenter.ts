import {Sector} from "@/contracts/sector";
import {User} from "@/contracts/user";
import {FinancialTransaction} from "@/contracts/financialTransaction";

export interface CostCenter {
  id: number
  name: string
  sector_id: number
  user_id: number
  deleted_at: string | null
  created_at: string | null
  updated_at: string | null
  sector: Sector
  user: User
  financialTransactions: FinancialTransaction[]
}
