import {Project} from "@/contracts/project";
import {PlayerStatus} from "@/contracts/playerStatus";
import {Deposit} from "@/contracts/deposit";
import {Player} from "@/contracts/player";
import {Withdraw} from "@/contracts/withdraw";
import {PlayerLogin} from "@/contracts/playerLogin";

export interface PostbackLog {
  id: number
  project_id: number
  type: string
  payload: any[]
  status: string
  error: string | null
  processed_at: string | null
  loggable_type: string
  loggable_id: number
  created_at: string
  updated_at: string
  project: Project
  loggable: Deposit|Player|Withdraw|PlayerLogin|PlayerStatus
}
