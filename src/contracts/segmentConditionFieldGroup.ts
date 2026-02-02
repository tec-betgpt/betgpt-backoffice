import {SegmentConditionField} from "@/contracts/segmentConditionField";

export interface SegmentConditionFieldGroup {
  id: number
  name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  fields: SegmentConditionField[]
}
