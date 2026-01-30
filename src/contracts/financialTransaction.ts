import {Withdraw} from "@/contracts/withdraw";
import {User} from "@/contracts/user";
import {CostCenter} from "@/contracts/costCenter";
import {Deposit} from "@/contracts/deposit";

export interface FinancialTransaction {
  id: number
  cost_center_id: number
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
  user: User
  costCenter: CostCenter
  deposits: Deposit[]
  withdraws: Withdraw[]
}
