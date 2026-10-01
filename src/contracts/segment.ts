import {User} from "@/contracts/user";
import {SegmentConditionGroup} from "@/contracts/segmentConditionGroup";
import {SegmentResult} from "@/contracts/segmentResult";
import {TargetAudience} from "@/contracts/targetAudience";
import {ProjectSummary} from "@/contracts/projectSummary";

export interface Segment {
  id: number
  name: string
  description: string | null
  project_id: number
  user_id: number
  total_contacts: number
  last_job_execute_at: string | null
  target_audiences: Array<any> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  project?: ProjectSummary | null
  user: User
  conditionGroups: SegmentConditionGroup[]
  results: SegmentResult[]
  targetAudiences: TargetAudience[]
}
