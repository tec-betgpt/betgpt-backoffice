import {Project} from "@/contracts/project";

export interface ProjectSmsfunnel {
  id: number
  project_id: number
  date: string
  sent_message_sms: number
  sent_message_whatsapp: number
  sent_clicks: number
  credits_sms_contracted: number
  credits_sms_sent: number
  credits_sms_available: number
  credits_whatsapp_contracted: number
  credits_whatsapp_sent: number
  credits_whatsapp_available: number
  recharges: any[]
  credits_response: any[]
  campaigns: any[]
  created_at: string
  updated_at: string
  project: Project
}
