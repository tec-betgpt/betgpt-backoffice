import {FinancialTransaction} from "@/contracts/financialTransaction";
import {Player} from "@/contracts/player";
import {Param} from "@/contracts/param";
import {DepositInformation} from "@/contracts/depositInformation";

export interface Deposit {
  id: number
  player_id: number
  project_id: number
  value: number
  status: number
  currency: string
  created_at: string | null
  updated_at: string | null
  player: Player
  params: Param[]
  information: DepositInformation | null
  financialTransaction: FinancialTransaction | null
}
