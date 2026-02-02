import {TargetAudience} from "@/contracts/targetAudience";
import {TargetAudienceCondition} from "@/contracts/targetAudienceCondition";

export interface TargetAudienceConditionGroup {
  id: number
  target_audience_id: number
  logic_operator: string
  created_at: string
  updated_at: string
  targetAudience: TargetAudience
  conditions: TargetAudienceCondition[]
}
