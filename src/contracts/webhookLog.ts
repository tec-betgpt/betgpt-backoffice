import {Project} from "@/contracts/project";

export interface WebhookLog {
  id: number
  project_id: number
  webhookable_id: number
  webhookable_type: string
  response_status: number | null
  success: boolean
  reason: string | null
  created_at: string | null
  updated_at: string | null
  project: Project
}
