import {Project} from "@/contracts/project";
import {Player} from "@/contracts/player";

export interface PlayerHistory {
  id: number
  player_id: number
  project_id: number | null
  historyable_id: number
  historyable_type: string
  type: string
  title: string
  description: string
  payload: any[] | null
  date: string
  player: Player
  project: Project | null
  historyable: any
}
