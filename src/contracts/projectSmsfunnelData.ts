import {ProjectSmsfunnelCampaign} from "@/contracts/projectSmsfunnelCampaign";
import {ProjectSmsfunnel} from "@/contracts/projectSmsfunnel";

export interface ProjectSmsfunnelData {
  id: number
  project_smsfunnel_id: number
  campaign_id: number
  date: string
  sms: number
  whatsapp: number
  clicks: number
  created_at: string
  updated_at: string
  projectSmsfunnel: ProjectSmsfunnel
  campaign: ProjectSmsfunnelCampaign
}
