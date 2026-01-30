import {Segment} from "@/contracts/segment";
import {Project} from "@/contracts/project";
import {TargetAudienceConditionGroup} from "@/contracts/targetAudienceConditionGroup";
import {TargetAudienceResult} from "@/contracts/targetAudienceResult";
import {TargetAudienceSync} from "@/contracts/targetAudienceSync";
import {User} from "@/contracts/user";

export interface TargetAudience {
  id: number
  name: string
  description: string | null
  user_id: number
  project_id: number
  duration: number
  players: Array<any> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  $user: User
  $project: Project
  $conditionGroups: TargetAudienceConditionGroup[]
  $result: TargetAudienceResult[]
  $segments: Segment[]
  $syncs: TargetAudienceSync[]
}
