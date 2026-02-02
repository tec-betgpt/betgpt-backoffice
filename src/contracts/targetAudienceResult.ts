import {Player} from "@/contracts/player";
import {TargetAudience} from "@/contracts/targetAudience";

export interface TargetAudienceResult {
  id: number
  target_id: number
  player_id: number
  created_at: string
  updated_at: string
  target: TargetAudience
  player: Player
}
