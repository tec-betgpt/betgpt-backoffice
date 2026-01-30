import {Project} from "@/contracts/project";

export interface ProjectReturnReport {
  id: number
  project_id: number
  date: string
  channel_group: string
  channel_name: string
  total_value: number
  conversion_count: number
  created_at: string
  updated_at: string
  project: Project
}
