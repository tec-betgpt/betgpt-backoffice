import {Project} from "@/contracts/project";

export interface ProjectMetric {
  id: number
  project_id: number
  date: string
  deposits_amount: number
  deposits_count: number
  withdraws_amount: number
  withdraws_count: number
  net_deposit: number
  ftd_amount: number
  ftd_count: number
  ftd_day_percent: number
  active_users: number
  registered_users: number
  ftd_amount_registered_users: number
  ftd_count_registered_users: number
  ftd_percent_registered_users: number
  '7d_deposits': number
  '14d_deposits': number
  '28d_deposits': number
  '7d_net_deposits': number
  '14d_net_deposits': number
  '28d_net_deposits': number
  '7d_active_users': number
  '14d_active_users': number
  '28d_active_users': number
  '7d_percent_net_deposits': number
  '14d_percent_net_deposits': number
  '28d_percent_net_deposits': number
  pending_deposits_amount: number
  pending_deposits_count: number
  pending_withdraws_amount: number
  pending_withdraws_count: number
  average_transaction_value: number
  transaction_frequency: number
  customer_retention_time: number
  execution_seconds: number
  created_at: string
  updated_at: string
  project: Project
}
