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

/**
 * Condição formatada retornada pelo show de conversion-definitions.
 */
export interface ConversionDefinitionConditionItem {
  conditionable_type: string
  conditionable_name: string
  conditionable_id: number
  conditionable_rule?: string | null
}
