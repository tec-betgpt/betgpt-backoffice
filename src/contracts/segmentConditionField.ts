import {SegmentCondition} from "@/contracts/segmentCondition";
import {SegmentConditionFieldGroup} from "@/contracts/segmentConditionFieldGroup";

export interface SegmentConditionField {
  id: number
  segment_condition_field_group_id: number
  label: string
  field_table: string
  field_key: string
  data_type: string
  is_dynamic: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  group: SegmentConditionFieldGroup
  segment_conditions: SegmentCondition[]
  operators: Array<any>
}
