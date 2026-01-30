import {SegmentConditionField} from "@/contracts/segmentConditionField";
import {SegmentConditionGroup} from "@/contracts/segmentConditionGroup";

export interface SegmentCondition {
  $id: number
  $segment_condition_group_id: number
  $segment_condition_field_id: number
  $operator: string
  $value_type: string
  value: Array<any>
  modifier: string | null
  logic_operator: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  group: SegmentConditionGroup
  field: SegmentConditionField
}
