import {ConversionEvent} from "@/contracts/conversionEvent";
import {Player} from "@/contracts/player";

export interface ConversionPlayerEvent {
  id: number
  player_id: number
  conversion_event_id: number
  value: number
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  player: Player
  conversionEvent: ConversionEvent
}
