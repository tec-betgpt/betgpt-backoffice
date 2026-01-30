import {Project} from "@/contracts/project";
import {Deposit} from "@/contracts/deposit";
import {Player} from "@/contracts/player";
import {PlayerStatus} from "@/contracts/playerStatus";

export interface Param {
  id: number
  name: string
  value: string
  source_id: number
  source_type: string
  project_id: number
  created_at: string
  updated_at: string
  model: Deposit | Player | PlayerStatus
  project: Project
}
