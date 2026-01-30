import {Project} from "@/contracts/project";

export interface ProjectSmsfunnelCampaign {
  id: number
  project_id: number | null
  reference: string
  name: string
  type: string
  last_sent_date: string
  created_at: string
  updated_at: string
  project: Project | null
}
