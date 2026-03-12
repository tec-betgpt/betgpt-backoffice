import { ProjectCall4uCampaign } from "@/contracts/projectCall4uCampaign";

export interface ProjectCall4uCall {
  id: number;
  campaign_id: number;
  call_id: string;
  date: string;
  client_name: string | null;
  phone_number: string;
  status: string;
  percentage_heard: number;
  seconds_duration: number;
  actual_attempt: number;
  configured_attempts: number;
  tried_at: string | null;
  created_at: string;
  updated_at: string;
  campaign: ProjectCall4uCampaign;
}
