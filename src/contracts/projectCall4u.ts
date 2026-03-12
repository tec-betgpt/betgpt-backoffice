import { Project } from "@/contracts/project";

export interface ProjectCall4u {
  id: number;
  project_id: number;
  date: string;
  sent_calls: number;
  credits_calls_contracted: number;
  credits_calls_sent: number;
  credits_calls_available: number;
  recharges: any[];
  credits_response: any;
  created_at: string;
  updated_at: string;
  project: Project;
}
