import {GoogleAnalyticsChannelGroup} from "@/contracts/googleAnalyticsChannelGroup";
import {Segment} from "@/contracts/segment";

export interface ConversionDefinitionCondition {
  id: number
  conversion_definition_id: number
  conditionable_id: number
  conditionable_type: string
  created_at: string | null
  updated_at: string | null
  conditionable: GoogleAnalyticsChannelGroup | Segment
}
