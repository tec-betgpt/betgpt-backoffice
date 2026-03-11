import { ProjectCall4u } from "@/contracts/projectCall4u";
import { ProjectCall4uCampaign } from "@/contracts/projectCall4uCampaign";

export interface ProjectCall4uMetric {
  id: number;
  project_call4u_id: number;
  campaign_id: number;
  date: string;
  total_sent: number;
  total_unique_numbers: number;
  total_answered: number;
  declined_no_answer: number;
  answered_and_disconnected: number;
  answered_and_listened_to_the_end: number;
  answered_with_typing: number;
  avg_answered_duration_seconds: number;
  created_at: string;
  updated_at: string;
  call4u: ProjectCall4u;
  campaign: ProjectCall4uCampaign;
}
