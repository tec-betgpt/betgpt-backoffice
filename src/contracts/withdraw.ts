import {Player} from "@/contracts/player";
import {Project} from "@/contracts/project";
import {Param} from "@/contracts/param";
import {FinancialTransaction} from "@/contracts/financialTransaction";

export interface Withdraw {
  id: number
  player_id: number
  project_id: number
  value: number
  status: number
  currency: string
  created_at: string | null
  updated_at: string | null
  player: Player
  project: Project
  params: Param[]
  financialTransaction: FinancialTransaction | null
}
