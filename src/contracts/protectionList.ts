import {User} from "@/contracts/user";
import {Player} from "@/contracts/player";
import {Project} from "@/contracts/project";

export interface ProtectionList {
  id: number
  player_id: number
  project_id: number
  user_id: number
  dispatch_type: string
  event_type: string
  channel: string
  start_at: string | null
  end_at: string | null
  reason: string | null
  active: boolean
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  player: Player | null
  project: Project | null
  user: User | null
}
