import { Project } from "@/contracts/project";

export interface ProjectCall4uCampaign {
  id: number;
  project_id: number | null;
  reference: string;
  name: string;
  status: string | null;
  attempts: number | null;
  start_date: string | null;
  end_date: string | null;
  audios: any[];
  last_sent_date: string | null;
  created_at: string;
  updated_at: string;
  project: Project | null;
}
