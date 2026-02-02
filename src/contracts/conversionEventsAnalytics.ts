import {ConversionDefinition} from "@/contracts/conversionDefinition";

export interface ConversionEventsAnalytics {
  id: number
  conversion_definition_id: number
  date: string
  total_revenue: number
  event_count: number
  channel_name: string | null
  channel_group: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  conversion: ConversionDefinition
}
