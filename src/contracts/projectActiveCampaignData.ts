import {Project} from "@/contracts/project";

export interface ProjectActiveCampaignData {
  id: number
  project_id: number
  qt_contact: number
  limit_contact: number
  qt_limit_exceeded: number
  qt_mail_limits: number
  qt_mail_sent: number
  qt_mail_exceeded: number
  created_at: string
  updated_at: string
  project: Project
}
