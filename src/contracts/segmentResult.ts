import {Player} from "@/contracts/player";
import {Segment} from "@/contracts/segment";

export interface SegmentResult {
  id: number
  player_id: number
  segment_id: number
  created_at: string
  updated_at: string
  segment: Segment
  player: Player
}
