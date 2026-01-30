import {Project} from "@/contracts/project";

export interface ProjectProfile {
  id: number
  project_id: number
  deposit_approved: number
  deposit_pending: number
  deposit_quantity_approved: number
  deposit_quantity_pending: number
  withdraw_approved: number
  withdraw_pending: number
  withdraw_quantity_approved: number
  withdraw_quantity_pending: number
  player_quantity: number
  project: Project
}
