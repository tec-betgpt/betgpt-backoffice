import {Project} from "@/contracts/project";
import {Player} from "@/contracts/player";

export interface PlayerStatus {
  id: number
  player_id: number
  project_id: number
  status: boolean
  created_at: string
  updated_at: string
  player: Player
  project: Project
}
