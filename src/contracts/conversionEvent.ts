import {ConversionPlayerEvent} from "@/contracts/conversionPlayerEvent";
import {ConversionDefinition} from "@/contracts/conversionDefinition";

export interface ConversionEvent {
  id: number
  conversion_definition_id: number
  conversion_value: number
  conversion_total: number
  date: string
  event_count: number
  event_total: number
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  conversion: ConversionDefinition
  playerEvents: ConversionPlayerEvent[]
  player_events_count: number | null
}
