import {TargetAudienceConditionGroup} from "@/contracts/targetAudienceConditionGroup";

export interface TargetAudienceCondition {
  id: number
  target_audience_condition_group_id: number
  source: string
  property: string
  operator: string
  value: string
  created_at: string
  updated_at: string
  $group: TargetAudienceConditionGroup
}
