import {Param} from "@/contracts/param";
import {Player} from "@/contracts/player";
import {Project} from "@/contracts/project";

export interface PlayerLogin {
  id: number
  player_id: number
  project_id: number
  created_at: string
  player: Player
  project: Project
  params: Param[]
}
