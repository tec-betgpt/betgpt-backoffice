import {Project} from "@/contracts/project";

export interface ProjectActiveCampaignMessage {
  project_id: number
  campaign_id: number
  subject: string
  body: string
  rawtext: string
  created_at: string
  updated_at: string
  project: Project
}
