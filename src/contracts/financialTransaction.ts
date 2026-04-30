import {Withdraw} from "@/contracts/withdraw";
import {User} from "@/contracts/user";
import {CostCenter} from "@/contracts/costCenter";
import {Deposit} from "@/contracts/deposit";
import {Sector} from "@/contracts/sector";

export interface FinancialTransaction {
  id: number
  cost_center_id: number
  sector_id: number | null
  user_id: number
  type: string
  category_type: string
  percentage: number
  amount: number
  date: string
  description: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  user?: User | null
  sector?: Sector | null
  costCenter: CostCenter
  deposits: Deposit[]
  withdraws: Withdraw[]
}
