import {Project} from "@/contracts/project";

export interface ProjectActiveCampaign {
  id: number
  project_id: number
  date: string
  campaigns: any[]
  created_at: string
  updated_at: string
  project: Project
}
