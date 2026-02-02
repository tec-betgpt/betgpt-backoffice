import {SegmentCondition} from "@/contracts/segmentCondition";
import {Segment} from "@/contracts/segment";

export interface SegmentConditionGroup {
  id: number
  segment_id: number
  logic_operator: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  segment: Segment
  conditions: SegmentCondition[]
}
