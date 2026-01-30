import {Project} from "@/contracts/project";
import {Player} from "@/contracts/player";

export interface PlayerProfile {
  id: number
  player_id: number
  project_id: number
  deposit_approved: number
  deposit_pending: number
  deposit_quantity_approved: number
  deposit_quantity_pending: number
  withdraw_approved: number
  withdraw_pending: number
  withdraw_quantity_approved: number
  withdraw_quantity_pending: number
  first_login_at: string | null
  last_login_at: string | null
  first_deposit_value: number | null
  first_deposit_date: string | null
  first_withdraw_value: number | null
  first_withdraw_date: string | null
  last_deposit_value: number | null
  last_deposit_date: string | null
  last_withdraw_value: number | null
  last_withdraw_date: string | null
  average_transaction_value: number | null
  transaction_frequency: string | null
  customer_retention_time: number | null
  player: Player
  project: Project
}
