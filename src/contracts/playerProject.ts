import {Project} from "@/contracts/project";
import {Player} from "@/contracts/player";

export interface PlayerProject {
  id: number
  player_id: number
  project_id: number
  external_id: string | null
  referrer_id: string | null
  status: number
  created_at: string
  updated_at: string
  player: Player
  project: Project
}
