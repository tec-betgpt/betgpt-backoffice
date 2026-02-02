import {ConversionEvent} from "@/contracts/conversionEvent";
import {Project} from "@/contracts/project";
import {User} from "@/contracts/user";
import {ConversionDefinitionCondition} from "@/contracts/conversionDefinitionCondition";
import {ConversionPlayerEvent} from "@/contracts/conversionPlayerEvent";

export interface ConversionDefinition {
  id: number
  project_id: number
  user_id: number
  name: string
  description: string
  type: string
  is_primary: boolean
  conversion_value_field: string|null
  is_return_report: boolean
  metric_source_type: string
  conversion_category: string
  channel_group: string
  created_at: string|null
  updated_at: string|null
  deleted_at: string|null
  project: Project
  user: User
  conditions: ConversionDefinitionCondition[]
  conditions_count: number|null
  events: ConversionEvent[]
  eventsAnalytics: ConversionEvent[]
  allPlayerEvents: ConversionPlayerEvent[]
  events_count: number|null
  all_player_events_count: number|null
}
